import { debug, getInput, setFailed, setOutput } from '@actions/core';
import { DescribeServicesCommand, DescribeServicesCommandOutput, ECSClient } from '@aws-sdk/client-ecs';

async function checkService(): Promise<void> {
    const region = getInput('region', { required: true });

    const ecsClient = new ECSClient({
        region: region,
    });

    const serviceName = getInput('service', { required: true });
    let clusterName: string | undefined = getInput('cluster', { required: false });

    if (!clusterName) {
        debug('Using default value for cluster name');
        clusterName = 'default';
    }

    const command = new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
    });

    debug('Sending describe services command');
    let describeServicesCommandOutput: DescribeServicesCommandOutput | undefined;
    try {
        describeServicesCommandOutput = await ecsClient.send(command);
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
        setFailed(error);
        debug('Sending describe services command failed');
        throw error;
    }

    if (describeServicesCommandOutput.failures && describeServicesCommandOutput.failures.length > 0) {
        const failure = describeServicesCommandOutput.failures[0];
        throw new Error(`${failure!.arn} is ${failure!.reason}`);
    }

    if (!describeServicesCommandOutput.services || describeServicesCommandOutput.services.length === 0) {
        setOutput('exists', false);
        setOutput('service-status', 'UNKNOWN');
        debug('Service does not exists in the cluster');
        return;
    }

    const service = describeServicesCommandOutput.services[0]!;

    setOutput('exists', true);

    const status = service.status;

    if (!status) {
        throw new Error(`Service status for ${serviceName} not found`);
    }

    setOutput('service-status', status);
}

async function run(): Promise<void> {
    try {
        await checkService();
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
        debug('Failed to send describe services command');
        setFailed(error.message);
        debug(error.stack);
    }
}

export { run };

if (require.main === module) {
    run();
}
