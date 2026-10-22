# TailPad

A collaborative visual novel game engine and editor with real-time synchronization capabilities. TailPad provides an interactive panel-based interface for creating, editing, and playing visual novels or interactive stories with real-time collaboration support.

## Features

- **Real-time Collaboration**: Multiple users can simultaneously edit and play the game through synchronized state management
- **Panel-based Interface**: Modular UI with draggable and resizable panels for different functions
- **Visual Story Editor**: Graphical editor for creating game scenes and interactions
- **Game Engine**: Built-in engine for running visual novels with text, backgrounds, and timed events
- **Persistent Storage**: Scenes and project files are stored as plain JSON in the project directory
- **Project Manager**: Asset browser and `config.json5` editor available from the UI
- **Yjs-based Synchronization**: Real-time state synchronization across connected clients

## Architecture

TailPad consists of two main components:

1. **Frontend Client**: A web-based interface with multiple draggable panels
2. **Backend Server**: A bun server handling WebSocket connections and file persistence

### Project layout

Every game is a directory containing the editor configuration and assets:

```text
game/
  config.json5
  assets/
    scenes/<id>.json
    bg/
    char/
    audio/
    ui/
    data/
  build/
```

`assets/scenes/<id>.json` is the source of truth. Each file is a plain JSON array of actions, exactly what the game runtime reads. The server loads a scene from disk when the first client opens it and saves it back after edits.

### Panels

The application uses a panel-based interface with several functional panels:

- **Editor Panel**: Text editor with real-time synchronization
- **Game Preview Panel**: Visual display for the game being created/played
- **Game Controller Panel**: Controls for managing game flow (next step, reset, etc.)
- **Graphical Editor Panel**: Visual editor for creating and arranging game scenes
- **Project Panel**: Asset browser (upload, rename, delete, folders) and `config.json5` editor

### Data Synchronization

- Uses Yjs for real-time state synchronization
- WebSocket-based communication using the GlovesLink protocol
- Client-server state synchronization for collaborative editing
- Automatic conflict resolution through Yjs CRDT implementation
- Scene changes are written to `assets/scenes/<id>.json` with a short debounce, and immediately on "Save now"

### Game Engine

The built-in game engine supports various action types:

- **Text Actions**: Display text in the game dialog
- **Background Actions**: Change the visual background
- **Delay Actions**: Introduce timed pauses between events

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/wxn0brP/TailPad.git
   cd TailPad
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Build the project:
   ```bash
   bun run build
   ```

## Linking

Get [ing command](https://github.com/wxn0brP/dotfiles)

Create a symlink using `ing`:
```bash
ing
```

## Creating a project

Initialize a new game project in the current directory:

```bash
tailpad-init
```

Or create a directory with a title:

```bash
tailpad-init my-game --title "My Game"
```

## Usage

Start the server in the current directory:

```bash
TAILPAD_TOKEN=your-secret tailpad-server
```

Or point it at a game project:

```bash
TAILPAD_TOKEN=your-secret tailpad-server games/gierek-the-game
```

The server requires the `TAILPAD_TOKEN` environment variable and exits when it is missing. The client must send the same token: it reads it from the `#pass=<token>` URL hash, or asks for it on start when the hash is missing. The token is remembered in `sessionStorage`, so reloading while switching scenes does not ask for it again. HTTP requests to the project API use the same token in the `Authorization: Bearer` header.

Build the game in the current directory:

```bash
tailpad-bundle
```

Or build a specific project:

```bash
tailpad-bundle games/gierek-the-game
```

The output goes to the `outdir` from that project's `config.json5`.

## Build configuration

The build configuration is defined in the `config.json5` file in the project directory. It can also be edited from the Project panel in the editor.

```json
{
   "title": "string || Tail Pad Game",
   "icon": "? string",
   "outdir": "string || game-build",
   "scripts": "? string[]",
   "styles": "? string[]",
   "head": "? string",
   "body": "? string",
}
```

## Technologies Used

- **TypeScript**: Language for type-safe development
- **Yjs**: Real-time collaboration and state synchronization
- **ESBuild**: Fast bundling and building
- **Sass**: CSS preprocessing
- **Gloves Link**: WebSocket communication
- **Custom UI Components**: Flanker UI components

## Panel System

The UI is built around a flexible panel system that allows users to:

- Drag panels to reposition them
- Resize panels to fit their workflow
- Collapse panels when not needed
- Customize panel positions and sizes

Each panel has:
- A header with title and controls
- Resizable content area
- Configurable minimum dimensions
- Customizable initial position and size

## Game Engine Capabilities

The game engine supports creating interactive stories with:

- Text dialogs that advance the story
- Background image changes
- Timed delays between actions
- Configurable pause and reset controls
- Scene indexing and navigation

## Contributing

Contributing are welcome!

## License

MIT License - see the [LICENSE](./LICENSE) file for details.
