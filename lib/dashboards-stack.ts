import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as loadBalancedFargateService from 'aws-cdk-lib/aws-ecs-patterns';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class DashboardsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'DashboardsQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });


// Put below lines within the DashboardsStack constructor
const vpc = new ec2.Vpc(this, 'MyVpc');

const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
  vpc: vpc,
  internetFacing: true,
  loadBalancerName: 'DashboardBalancer'
});


// Put below lines within the DashboardsStack constructor
const cluster = new ecs.Cluster(this, 'DashboardCluster', {
  vpc: vpc
});

const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
  cpu: 256,
  memoryLimitMiB: 512,
});

const port = 3000

  const container = taskDefinition.addContainer('Container', {
  image: ecs.ContainerImage.fromRegistry('artemsavchuk94/node-web-app2'),
  portMappings: [{ containerPort: port }],
})

const service = new ecs.FargateService(this, 'FargateService', {
  cluster: cluster,
  taskDefinition: taskDefinition,
  desiredCount: 1,
  serviceName: 'FargateService'
})

const tg1 = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
  vpc: vpc,
  targets: [service],
  protocol: elbv2.ApplicationProtocol.HTTP,
  //stickinessCookieDuration: cdk.Duration.days(1),
  //stickinessCookieDuration: Duration.minutes(5),

  port: port,
  healthCheck: {
    path: '/',
    port: `${port}`
  }
})
const listener = lb.addListener(`HTTPListener`, {
  port: 80,
  defaultAction: elbv2.ListenerAction.forward([tg1]) 
})




const scalableTarget = service.autoScaleTaskCount({
  minCapacity: 1,
  maxCapacity: 2,
});

scalableTarget.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 50,
});

scalableTarget.scaleOnMemoryUtilization('MemoryScaling', {
  targetUtilizationPercent: 50,
});




//const scaling = service.autoScaleTaskCount({ maxCapacity: 1 });
//scaling.scaleOnSchedule('StartVectorizationTask', {
  //schedule: Schedule.cron({ minute: '10' }),
  //maxCapacity: 1,
  //minCapacity: 1,
//});
//scaling.scaleOnSchedule('StopVectorizationTask', {
  //schedule: Schedule.cron({ minute: '20' }),
  //maxCapacity: 0,
  //minCapacity: 0,
//});



  //const autoScale = service.autoScaleTaskCount({
  //minCapacity: 1,
  //maxCapacity: 2,
//});

//autoScale.scaleOnCpuUtilization("CPUAutoscaling", {
  //targetUtilizationPercent: 50,
  //scaleInCooldown: cdk.Duration.seconds(30),
  //scaleOutCooldown: cdk.Duration.seconds(30),
//});



 //const scaling = service.service.autoScaleTaskCount({ maxCapacity: 3, minCapacity: 1 });
//scaling.scaleOnCpuUtilization('autoscale_cpu', {
  //targetUtilizationPercent: 50,
  //scaleInCooldown: Duration.minutes(2),
  //scaleOutCooldown: Duration.seconds(30)
//});


//const springbootAutoScaling = exampleApp.service.autoScaleTaskCount({
  //maxCapacity: 4,
  //minCapacity: 2
//})

//springbootAutoScaling.scaleOnCpuUtilization('cpu-autoscaling', {
  //targetUtilizationPercent: 45,
 // policyName: "cpu-autoscaling-policy",
  //scaleInCooldown: cdk.Duration.seconds(30),
 // scaleOutCooldown: cdk.Duration.seconds(30)
//})






  }
}
