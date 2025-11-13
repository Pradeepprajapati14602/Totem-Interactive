# 🧠 Totem Interactive - Long-Term Memory Warehouse

A full-stack Next.js application for managing long-term memories of autonomous AI agents with semantic search, memory evolution, and intelligent clustering.

![Next.js](https://img.shields.io/badge/Next.js-16+-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748)

## ✨ Features

- 🤖 **Multi-Agent Support**: Manage memories for multiple AI agents
- 🔍 **Semantic Search**: Vector-based similarity search using Gemini embeddings
- 🧬 **Memory Evolution**: Automatic summarization and consolidation of old memories
- 📊 **Visual Dashboard**: Interactive charts and timelines with Recharts
- 📈 **Real-time Monitoring**: Performance metrics and memory analytics
- 🎯 **Memory Strength**: Track and decay memory relevance over time
- 🚀 **Real-time Updates**: Optimistic UI updates
- 🎨 **Modern UI**: Beautiful components with Tailwind CSS + ShadCN UI
- 🧪 **Tested**: Comprehensive Jest test suite

## 🏗️ Tech Stack

### Frontend
- **Next.js 16** with App Router & Turbopack
- **TypeScript** for type safety

- **Tailwind CSS** + **ShadCN UI** for styling

- **Recharts** for data visualization- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- **Lucide React** for icons- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.



### BackendYou can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

- **Next.js API Routes** (Server Actions)

- **Prisma ORM** with PostgreSQL## Deploy on Vercel

- **pgvector** extension for semantic search

- **Google Gemini 1.5 Pro** for embeddings & summarizationThe easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

- **Redis** (optional) for caching

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

### Database
- **PostgreSQL** with pgvector extension
- Vector embeddings (1536 dimensions)
- Indexed for fast similarity search

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ installed
- **PostgreSQL** 14+ installed with **pgvector** extension
- **Google Gemini API Key** ([Get one here](https://makersuite.google.com/app/apikey))
- **Redis** (optional, for caching)

## 🚀 Quick Start

### 1. Clone & Install

```bash
cd todam
npm install
```

### 2. Setup PostgreSQL with pgvector

```bash
# Install pgvector extension (Ubuntu/Debian)
sudo apt install postgresql-14-pgvector

# Or on macOS with Homebrew
brew install pgvector

# Connect to PostgreSQL
psql -U postgres

# Create database and enable extension
CREATE DATABASE totem_memory;
\c totem_memory
CREATE EXTENSION vector;
\q
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database (Update with your credentials)
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/totem_memory?schema=public"

# Gemini API Key (Required)
GEMINI_API_KEY="your-gemini-api-key-here"

# Redis (Optional)
REDIS_URL="redis://localhost:6379"
REDIS_ENABLED="false"

# App Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
MEMORY_DECAY_RATE="0.1"
EVOLUTION_THRESHOLD_DAYS="7"
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) in your browser.

## 📁 Project Structure

```
todam/
├── app/
│   ├── api/
│   │   ├── agent/
│   │   │   ├── route.ts                 # List/Create agents
│   │   │   └── [id]/route.ts            # Get/Delete specific agent
│   │   └── memory/
│   │       ├── route.ts                 # List/Create memories
│   │       ├── [id]/route.ts            # Get/Update/Delete memory
│   │       ├── similar/route.ts         # Semantic search
│   │       └── evolve/route.ts          # Memory evolution
│   ├── dashboard/
│   │   └── page.tsx                     # Main dashboard UI
│   ├── _components/
│   │   ├── MemoryCard.tsx               # Memory display card
│   │   ├── ClusterGraph.tsx             # Memory clustering viz
│   │   ├── EvolutionTimeline.tsx        # Evolution timeline
│   │   └── ui/                          # ShadCN components
│   └── _lib/
│       ├── db.ts                        # Prisma client
│       ├── gemini.ts                    # Gemini AI integration
│       ├── redis.ts                     # Redis caching
│       ├── types.ts                     # TypeScript types
│       └── utils.ts                     # Utility functions
├── prisma/
│   └── schema.prisma                    # Database schema
├── tests/
│   └── api.memory.test.ts               # API integration tests
├── .env.example                         # Environment template
├── jest.config.ts                       # Jest configuration
├── next.config.mjs                      # Next.js configuration
├── tailwind.config.ts                   # Tailwind configuration
└── README.md
```

## 🔌 API Reference

### Agents

#### Create Agent
```bash
POST /api/agent
Content-Type: application/json

{
  "name": "Agent Name",
  "metadata": { "custom": "data" }
}
```

#### List Agents
```bash
GET /api/agent
```

#### Get Agent
```bash
GET /api/agent/:id
```

#### Delete Agent
```bash
DELETE /api/agent/:id
```

### Memories

#### Create Memory (with auto-embedding)
```bash
POST /api/memory
Content-Type: application/json

{
  "agentId": "uuid",
  "content": "Memory content here",
  "metadata": { "tags": ["important"] }
}
```

#### List Memories
```bash
GET /api/memory?agentId=uuid&limit=50&offset=0
```

#### Get Memory
```bash
GET /api/memory/:id
```

#### Update Memory Strength
```bash
PATCH /api/memory/:id
Content-Type: application/json

{
  "strength": 0.8
}
```

#### Delete Memory
```bash
DELETE /api/memory/:id
```

#### Semantic Search
```bash
GET /api/memory/similar?query=search+term&limit=10&agentId=uuid
```

Returns memories ranked by cosine similarity to query embedding.

#### Evolve Memories
```bash
PUT /api/memory/evolve
Content-Type: application/json

{
  "agentId": "uuid",          // optional
  "olderThanDays": 7          // optional
}
```

Summarizes and consolidates old memories using Gemini.

## 🧪 Testing

Run the test suite:

```bash
# Make sure server is running
npm run dev

# In another terminal
npm test
```

Tests cover:
- Memory creation with embeddings
- Semantic search functionality
- Memory retrieval and updates
- Agent management
- Error handling

## 🎨 Dashboard Features

### Memory Management
- Create agents and memories
- View all memories in card layout
- Filter by agent
- Real-time search

### Semantic Search
- Natural language queries
- Vector similarity ranking
- Cross-agent search

### Visualizations
1. **Memory Clusters**: Bar charts showing memory distribution
2. **Strength Distribution**: Scatter plot of memory strengths
3. **Growth Timeline**: Area chart of memory growth over time
4. **Evolution Events**: Recent memory consolidations

## 🔧 Configuration

### Memory Evolution Settings

In `.env`:

```env
MEMORY_DECAY_RATE="0.1"           # Strength reduction per evolution cycle
EVOLUTION_THRESHOLD_DAYS="7"       # Days before memory becomes eligible
```

### Redis Caching

Enable Redis for improved performance:

```env
REDIS_ENABLED="true"
REDIS_URL="redis://localhost:6379"
```

Cached data:
- Agent lists (5 min TTL)
- Individual agents (2 min TTL)
- Individual memories (5 min TTL)

## 🌐 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Set up PostgreSQL database (Vercel Postgres or external)
5. Deploy!

```bash
# Or use Vercel CLI
vercel --prod
```

### AWS EC2 + RDS

1. **Setup RDS PostgreSQL** with pgvector:
   ```sql
   CREATE EXTENSION vector;
   ```

2. **Setup EC2** instance:
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Clone and build
   git clone your-repo
   cd todam
   npm install
   npm run build

   # Use PM2 for process management
   sudo npm install -g pm2
   pm2 start npm --name "totem" -- start
   pm2 save
   pm2 startup
   ```

3. **Configure environment** variables on EC2
4. **Setup nginx** as reverse proxy

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Submit a pull request

## 📝 License

MIT License - feel free to use in your projects!

## 🆘 Troubleshooting

### pgvector not installed
```bash
ERROR: type "vector" does not exist
```
**Solution**: Install pgvector extension:
```sql
CREATE EXTENSION vector;
```

### Prisma migration fails
```bash
Error: P1001: Can't reach database
```
**Solution**: Check DATABASE_URL and ensure PostgreSQL is running

### Gemini API errors
```bash
Error: 403 Forbidden
```
**Solution**: Verify your GEMINI_API_KEY is valid

### Redis connection issues
```bash
Redis connection error
```
**Solution**: Set `REDIS_ENABLED="false"` or ensure Redis is running

## 🔮 Future Enhancements

- [ ] WebSocket real-time notifications
- [ ] NextAuth.js authentication
- [ ] Memory sharing between agents
- [ ] Export/import functionality
- [ ] Advanced clustering algorithms
- [ ] Dark/light mode toggle
- [ ] Mobile-responsive UI improvements
- [ ] GraphQL API option

## 📧 Support

For issues and questions:
- Open an issue on GitHub
- Check existing documentation
- Review API tests for usage examples

---

Built with ❤️ using Next.js, Prisma, and Gemini AI
#   T o t e m - I n t e r a c t i v e  
 