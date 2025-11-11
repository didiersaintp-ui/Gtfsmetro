# 🚇 GTFS Metro Map Visualizer

A professional, modern web application for visualizing GTFS (General Transit Feed Specification) transit data with both realistic geographic maps and stylized metro-like schematic diagrams.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **📤 Easy Upload**: Drag-and-drop GTFS .zip files
- **🗺️ Dual Rendering Modes**:
  - **Realistic View**: Geographic accuracy with Leaflet.js and OpenStreetMap
  - **Metro-Style View**: Beautiful schematic diagrams with octilinear layout
- **⚡ Lightning Fast**: Processes complex urban networks in under 60 seconds
- **🎨 Modern UI**: Built with Next.js 14, shadcn/ui, and TailwindCSS
- **📊 Smart Analysis**: Automatic classification of metro, tram, and bus routes
- **🔍 Interactive**: Zoom, pan, and filter routes dynamically
- **🐳 Docker Ready**: Deploy anywhere with Docker Compose

## 🏗️ Architecture

### Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **UI Components**: shadcn/ui, TailwindCSS, Framer Motion
- **Maps**: Leaflet.js, react-leaflet, D3.js (zoom, force-directed layout)
- **GTFS Processing**: node-gtfs, better-sqlite3
- **Geometry**: Turf.js
- **Containerization**: Docker, Docker Compose

### Layout Algorithms

The metro-style schematic view uses advanced graph layout algorithms:

1. **Graph Simplification**: Clustering nearby stops, reducing complexity
2. **Octilinear Layout**: Snapping lines to 0°, 45°, 90°, 135° angles
3. **Force-Directed Optimization**: Reducing overlaps and improving spacing
4. **Edge Bundling**: Grouping parallel lines for clarity

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** (recommended)
- OR **Node.js 20+** and **npm**

### Option 1: Docker (Recommended)

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd gtfs-metro-app
   ```

2. **Build and run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   Open your browser to [http://localhost:3005](http://localhost:3005)

### Option 2: Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   Open your browser to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### 1. Upload GTFS Data

- Click or drag-and-drop a GTFS .zip file on the home page
- The file will be uploaded and parsed automatically
- Processing typically takes 10-60 seconds depending on network size

### 2. View Realistic Map

- The realistic view shows your transit network on an interactive OpenStreetMap
- Routes are colored according to their GTFS color or auto-generated colors
- Click on routes and stops for detailed information
- Use mouse wheel to zoom, drag to pan

### 3. Generate Metro-Style View

- Click "Metro-Style View" button in the sidebar
- The algorithm will generate a schematic diagram (takes 10-30 seconds)
- Lines are simplified and snapped to octilinear angles (0°, 45°, 90°, etc.)
- Stations are positioned for optimal clarity and minimal overlaps

### 4. Interact with Maps

- **Zoom**: Mouse wheel or pinch gesture
- **Pan**: Click and drag
- **Filter**: Click lines in the legend to highlight
- **Info**: Click stations or routes for details

## 📁 Project Structure

```
gtfs-metro-app/
├── app/                      # Next.js 14 App Router
│   ├── api/                 # API routes
│   │   ├── upload/         # File upload endpoint
│   │   ├── parse/          # GTFS parsing endpoint
│   │   └── render/         # Layout generation endpoint
│   ├── map/[id]/           # Map visualization page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
│
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── upload/             # Upload components
│   │   └── FileDropzone.tsx
│   └── map/                # Map components
│       ├── RealisticMap.tsx
│       └── MetroMap.tsx
│
├── lib/
│   ├── gtfs/               # GTFS processing
│   │   ├── parser.ts       # Parse GTFS files
│   │   └── types.ts        # TypeScript definitions
│   ├── layout/             # Layout algorithms
│   │   ├── simplification.ts
│   │   ├── octilinear.ts
│   │   ├── force-directed.ts
│   │   └── metro-layout.ts
│   ├── map/                # Map utilities
│   │   └── geojson.ts
│   └── utils/              # Helpers
│       └── geometry.ts
│
├── styles/
│   └── globals.css         # Global styles
│
├── public/
│   └── uploads/            # Uploaded GTFS files
│
├── data/                   # SQLite databases
│
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🎨 Customization

### Colors

Edit line colors in `lib/gtfs/parser.ts`:

```typescript
const colors = [
  '#FF5733', '#33FF57', '#3357FF', // Add your colors here
];
```

### Layout Parameters

Adjust layout algorithms in `lib/layout/metro-layout.ts`:

```typescript
{
  width: 1200,        // Canvas width
  height: 800,        // Canvas height
  simplify: true,     // Enable simplification
  iterations: 300,    // Force-directed iterations
}
```

## 🐳 Docker Configuration

### Build Options

Custom build:
```bash
docker build -t gtfs-metro-app .
docker run -p 3005:3005 gtfs-metro-app
```

### Environment Variables

Configure via `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3005
```

### Volumes

- `./public/uploads`: Persisted uploaded files
- `gtfs-data`: SQLite databases

## 🧪 Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## 📊 Performance

- **Small networks** (< 50 routes): ~5-10 seconds total processing
- **Medium networks** (50-200 routes): ~15-30 seconds
- **Large networks** (200+ routes): ~30-60 seconds

Optimizations:
- SQLite for fast querying
- In-memory caching of parsed data
- Efficient graph algorithms
- Canvas rendering for large datasets

## 🔧 Troubleshooting

### "Failed to parse GTFS data"

- Ensure your GTFS file is valid (use [GTFS Validator](https://gtfs-validator.mobilitydata.org/))
- Check that required files exist: `routes.txt`, `stops.txt`, `trips.txt`

### "Layout generation timeout"

- Very large networks (500+ routes) may take longer
- Increase timeout in `lib/layout/metro-layout.ts`
- Consider reducing routes by filtering

### Docker build fails

- Ensure Docker has enough memory (4GB+ recommended)
- Clear Docker cache: `docker system prune -a`

## 📚 Resources

- [GTFS Specification](https://gtfs.org/)
- [Metro Map Layout Research](https://arxiv.org/abs/2004.03234)
- [Octilinear Graph Drawing](https://dl.acm.org/doi/10.1111/cgf.13986)
- [Next.js Documentation](https://nextjs.org/docs)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Transit agencies providing open GTFS data
- OpenStreetMap contributors
- Research papers on metro map layout algorithms
- Open-source libraries: Next.js, Leaflet, D3.js, Turf.js

---

**Built with ❤️ for the public transit community**

For questions or support, please open an issue on GitHub.
