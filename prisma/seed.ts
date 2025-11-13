import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const agent1 = await prisma.agent.upsert({
    where: { id: 'demo-agent-1' },
    update: {},
    create: {
      id: 'demo-agent-1',
      name: 'Alice AI',
      metadata: {
        role: 'Research Assistant',
        specialization: 'Machine Learning',
      },
    },
  });

  const agent2 = await prisma.agent.upsert({
    where: { id: 'demo-agent-2' },
    update: {},
    create: {
      id: 'demo-agent-2',
      name: 'Bob Bot',
      metadata: {
        role: 'Data Analyst',
        specialization: 'Natural Language Processing',
      },
    },
  });

  console.log('✅ Created agents:', agent1.name, agent2.name);

  console.log('💡 To add memories with embeddings, use the API endpoints');
  console.log('   POST /api/memory with agentId and content');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
