"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const tslib_1 = require("tslib");
const core_1 = tslib_1.__importDefault(require("@actions/core"));
const client_ecs_1 = require("@aws-sdk/client-ecs");
async function checkService() {
    const region = core_1.default.getInput('region', { required: true });
    const ecsClient = new client_ecs_1.ECSClient({
        region: region,
    });
    const serviceName = core_1.default.getInput('service', { required: true });
    let clusterName = core_1.default.getInput('cluster', { required: false });
    if (!clusterName) {
        core_1.default.debug('Using default value for cluster name');
        clusterName = 'default';
    }
    const command = new client_ecs_1.DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName],
    });
    core_1.default.debug('Sending describe services command');
    let describeServicesCommandOutput;
    try {
        describeServicesCommandOutput = await ecsClient.send(command);
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }
    catch (error) {
        core_1.default.setFailed(error);
        core_1.default.debug('Sending describe services command failed');
        throw error;
    }
    if (describeServicesCommandOutput.failures && describeServicesCommandOutput.failures.length > 0) {
        const failure = describeServicesCommandOutput.failures[0];
        throw new Error(`${failure.arn} is ${failure.reason}`);
    }
    if (!describeServicesCommandOutput.services || describeServicesCommandOutput.services.length === 0) {
        core_1.default.setOutput('exists', false);
        core_1.default.setOutput('service-status', 'UNKNOWN');
        core_1.default.debug('Service does not exists in the cluster');
        return;
    }
    const service = describeServicesCommandOutput.services[0];
    core_1.default.setOutput('exists', true);
    const status = service.status;
    if (!status) {
        throw new Error(`Service status for ${serviceName} not found`);
    }
    core_1.default.setOutput('service-status', status);
}
async function run() {
    try {
        await checkService();
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    }
    catch (error) {
        core_1.default.debug('Failed to send describe services command');
        core_1.default.setFailed(error.message);
        core_1.default.debug(error.stack);
    }
}
exports.run = run;
if (require.main === module) {
    run();
}
//# sourceMappingURL=index.js.map