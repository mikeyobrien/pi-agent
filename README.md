# pi-agent

Personal configuration for [pi coding agent](https://github.com/badlogic/pi-mono).

## Structure

```
pi-agent/
├── extensions/       # Custom tools and event handlers
│   ├── brave-search.ts
│   └── soul.ts       # SOUL.md loader
├── skills/           # On-demand capability packages
├── SOUL.md           # AI identity and values (see soul.md)
├── settings.json     # Reference settings (not symlinked)
└── install.sh        # Setup script
```

## Installation

```bash
git clone https://github.com/mikeyobrien/pi-agent.git ~/projects/pi-agent
cd ~/projects/pi-agent
./install.sh
```

## Extensions

- **brave-search.ts** - Web search via Brave Search API

## Environment Variables

```bash
export BRAVE_API_KEY="your-key"  # Required for brave-search
```
