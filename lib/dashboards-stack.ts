import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as Duration from 'aws-cdk-lib/core';


export class DashboardsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);



// Put below lines within the DashboardsStack constructor
const vpc = new ec2.Vpc(this, 'MyVpc');

const lb = new elbv2.ApplicationLoadBalancer(this, 'LB', {
  vpc: vpc,
  internetFacing: true,
  loadBalancerName: 'DashboardBalancer'
});
lb.addRedirect


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
  
  port: port,
  healthCheck: {
    path: '/',
    port: `${port}`
  }
})

const zone = route53.PublicHostedZone.fromPublicHostedZoneAttributes(this, 'as94.pretty-solution.com', {
  zoneName: 'as94.pretty-solution.com',
  hostedZoneId: 'Z0336998L8QXS5PKF9H0',
});

new route53.ARecord(this, 'AliasRecord', {
  zone,
  target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(lb)),
  // or - route53.RecordTarget.fromAlias(new targets.ApiGatewayDomain(domainName)),
});



const cert = new acm.DnsValidatedCertificate(this, 'my-cert', {
  hostedZone:zone,
  domainName: zone.zoneName,
  subjectAlternativeNames:['as94.pretty-solution.com']
    })



const listener = lb.addListener('HTTPListener', {
  port: 443,
  certificates: [cert],
  defaultAction: elbv2.ListenerAction.forward([tg1]),
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


 

  }
}
