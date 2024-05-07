"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const core_1 = require("@actions/core");
const client_ecs_1 = require("@aws-sdk/client-ecs");
async function describeService() {
    const ecsClient = new client_ecs_1.ECSClient();
    const serviceName = (0, core_1.getInput)('service', { required: true });
    let clusterName = (0, core_1.getInput)('cluster', { required: false });
    if (!clusterName) {
        (0, core_1.debug)('Using default value for cluster name');
        clusterName = 'default';
    }
    const command = new client_ecs_1.DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
    });
    (0, core_1.debug)('Sending describe services command');
    let describeServicesCommandOutput;
    try {
        describeServicesCommandOutput = await ecsClient.send(command);
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }
    catch (error) {
        (0, core_1.setFailed)(error);
        (0, core_1.debug)('Sending describe services command failed');
        throw error;
    }
    if (describeServicesCommandOutput.failures && describeServicesCommandOutput.failures.length > 0) {
        const failure = describeServicesCommandOutput.failures[0];
        if (failure.reason === 'MISSING') {
            (0, core_1.setOutput)('exists', false);
            (0, core_1.setOutput)('service-status', 'MISSING');
        }
        (0, core_1.debug)('Service does not exists in the cluster');
        return;
    }
    if (!describeServicesCommandOutput.services || describeServicesCommandOutput.services.length === 0) {
        (0, core_1.setOutput)('exists', false);
        (0, core_1.setOutput)('service-status', 'MISSING');
        (0, core_1.debug)('Service does not exists in the cluster');
        return;
    }
    const service = describeServicesCommandOutput.services[0];
    (0, core_1.setOutput)('exists', true);
    const status = service.status;
    if (!status) {
        throw new Error(`Service status for ${serviceName} not found`);
    }
    (0, core_1.setOutput)('service-status', status);
}
async function run() {
    try {
        await describeService();
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }
    catch (error) {
        (0, core_1.debug)('Failed to run describe service');
        (0, core_1.setFailed)(error.message);
        (0, core_1.debug)(error.stack);
    }
}
exports.run = run;
if (require.main === module) {
    run();
}
//# sourceMappingURL=index.js.map