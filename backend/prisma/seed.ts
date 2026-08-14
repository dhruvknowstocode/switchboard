import { PrismaClient, type Role } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

/**
 * Seed demo operators, environments, and a sample feature flag.
 */

const prisma = new PrismaClient();

const DEMO_USERS: Array<{
  email: string;
  name: string;
  role: Role;
  password: string;
}> = [
  {
    email: 'admin@switchboard.local',
    name: 'Admin User',
    role: 'ADMIN',
    password: 'Admin123!',
  },
  {
    email: 'release@switchboard.local',
    name: 'Release Manager',
    role: 'RELEASE_MANAGER',
    password: 'Release123!',
  },
  {
    email: 'dev@switchboard.local',
    name: 'Developer',
    role: 'DEVELOPER',
    password: 'Dev123!',
  },
  {
    email: 'viewer@switchboard.local',
    name: 'Viewer',
    role: 'VIEWER',
    password: 'Viewer123!',
  },
];

const ENVIRONMENTS = [
  { key: 'development', name: 'Development', description: 'Local / engineering' },
  { key: 'staging', name: 'Staging', description: 'Pre-production' },
  { key: 'production', name: 'Production', description: 'Live traffic' },
];

async function main(): Promise<void> {
  console.log('[seed] Seeding Switchboard…');

  for (const demo of DEMO_USERS) {
    const passwordHash = await hashPassword(demo.password);
    await prisma.user.upsert({
      where: { email: demo.email },
      create: {
        email: demo.email,
        name: demo.name,
        role: demo.role,
        passwordHash,
      },
      update: {
        name: demo.name,
        role: demo.role,
        passwordHash,
      },
    });
    console.log(`[seed] upserted user ${demo.email} (${demo.role})`);
  }

  for (const env of ENVIRONMENTS) {
    await prisma.environment.upsert({
      where: { key: env.key },
      create: env,
      update: { name: env.name, description: env.description },
    });
    console.log(`[seed] upserted environment ${env.key}`);
  }

  const admin = await prisma.user.findUniqueOrThrow({
    where: { email: 'admin@switchboard.local' },
  });
  const environments = await prisma.environment.findMany();

  const flag = await prisma.featureFlag.upsert({
    where: { key: 'new-bet-slip' },
    create: {
      key: 'new-bet-slip',
      name: 'New Bet Slip',
      description: 'Redesigned betting slip UI',
      createdById: admin.id,
      updatedById: admin.id,
    },
    update: {
      name: 'New Bet Slip',
      description: 'Redesigned betting slip UI',
      updatedById: admin.id,
    },
  });

  for (const env of environments) {
    const defaults =
      env.key === 'production'
        ? { enabled: true, rolloutPercentage: 25 }
        : env.key === 'staging'
          ? { enabled: true, rolloutPercentage: 100 }
          : { enabled: true, rolloutPercentage: 100 };

    await prisma.featureFlagConfig.upsert({
      where: {
        featureFlagId_environmentId: {
          featureFlagId: flag.id,
          environmentId: env.id,
        },
      },
      create: {
        featureFlagId: flag.id,
        environmentId: env.id,
        ...defaults,
      },
      update: defaults,
    });
  }

  console.log('[seed] upserted feature flag new-bet-slip with per-env configs');

  // Folio demo flags (reading app — used by packages/demo)
  const folioFlags: Array<{
    key: string;
    name: string;
    description: string;
    productionRollout: number;
  }> = [
    {
      key: 'folio-hero-v2',
      name: 'Folio Hero V2',
      description: 'Redesigned magazine hero for Folio demo app',
      productionRollout: 50,
    },
    {
      key: 'folio-audio-mode',
      name: 'Folio Audio Mode',
      description: 'Listen / audio playback affordance on articles',
      productionRollout: 25,
    },
    {
      key: 'folio-member-gate',
      name: 'Folio Member Gate',
      description: 'Soft membership CTA on long-form stories',
      productionRollout: 100,
    },
  ];

  for (const demoFlag of folioFlags) {
    const created = await prisma.featureFlag.upsert({
      where: { key: demoFlag.key },
      create: {
        key: demoFlag.key,
        name: demoFlag.name,
        description: demoFlag.description,
        createdById: admin.id,
        updatedById: admin.id,
      },
      update: {
        name: demoFlag.name,
        description: demoFlag.description,
        updatedById: admin.id,
      },
    });

    for (const env of environments) {
      const defaults =
        env.key === 'production'
          ? { enabled: true, rolloutPercentage: demoFlag.productionRollout, killed: false }
          : { enabled: true, rolloutPercentage: 100, killed: false };

      await prisma.featureFlagConfig.upsert({
        where: {
          featureFlagId_environmentId: {
            featureFlagId: created.id,
            environmentId: env.id,
          },
        },
        create: {
          featureFlagId: created.id,
          environmentId: env.id,
          ...defaults,
        },
        update: defaults,
      });
    }
    console.log(`[seed] upserted feature flag ${demoFlag.key}`);
  }

  // Fixed local demo API key for Folio SDK (never use in real production)
  const { createHash } = await import('crypto');
  const DEMO_API_KEY = 'sb_live_folio_demo_key_local_only_0001';
  const demoHash = createHash('sha256').update(DEMO_API_KEY).digest('hex');
  await prisma.apiKey.upsert({
    where: { keyHash: demoHash },
    create: {
      name: 'Folio Demo SDK',
      keyPrefix: DEMO_API_KEY.slice(0, 16),
      keyHash: demoHash,
      createdById: admin.id,
    },
    update: {
      name: 'Folio Demo SDK',
      revokedAt: null,
    },
  });
  console.log('[seed] upserted Folio demo API key');

  const existingIncident = await prisma.incident.findUnique({
    where: { number: 'INC-1001' },
  });
  if (!existingIncident) {
    await prisma.incident.create({
      data: {
        number: 'INC-1001',
        title: 'Bet slip error rate elevated',
        description:
          'Sample incident for demos. Use Kill Switch / Reduce Rollout against new-bet-slip.',
        severity: 'SEV_2',
        status: 'INVESTIGATING',
        createdById: admin.id,
        assignedToId: admin.id,
        affectedFlags: {
          create: [{ featureFlagId: flag.id }],
        },
        events: {
          create: {
            type: 'CREATED',
            message: 'Incident INC-1001 created: Bet slip error rate elevated',
            actorId: admin.id,
            metadata: { severity: 'SEV_2' },
          },
        },
      },
    });
    console.log('[seed] created sample incident INC-1001');
  } else {
    console.log('[seed] sample incident INC-1001 already exists');
  }

  console.log('[seed] Done.');
  console.log('[seed] Demo logins:');
  for (const demo of DEMO_USERS) {
    console.log(`  - ${demo.email} / ${demo.password}`);
  }
  console.log(`[seed] Folio demo API key: ${DEMO_API_KEY}`);
}

main()
  .catch((error) => {
    console.error('[seed] Failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
