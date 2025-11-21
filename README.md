# TailPad

A collaborative visual novel game engine and editor with real-time synchronization capabilities. TailPad provides an interactive panel-based interface for creating, editing, and playing visual novels or interactive stories with real-time collaboration support.

## Features

- **Real-time Collaboration**: Multiple users can simultaneously edit and play the game through synchronized state management
- **Panel-based Interface**: Modular UI with draggable and resizable panels for different functions
- **Visual Story Editor**: Graphical editor for creating game scenes and interactions
- **Game Engine**: Built-in engine for running visual novels with text, backgrounds, and timed events
- **Persistent Storage**: Automatic saving to database with both soft and hard save options
- **Yjs-based Synchronization**: Real-time state synchronization across connected clients

## Architecture

TailPad consists of two main components:

1. **Frontend Client**: A web-based interface with multiple draggable panels
2. **Backend Server**: A bun server handling WebSocket connections and database persistence

### Panels

The application uses a panel-based interface with several functional panels:

- **Editor Panel**: Text editor with real-time synchronization
- **Game Preview Panel**: Visual display for the game being created/played
- **Game Controller Panel**: Controls for managing game flow (next step, reset, etc.)
- **Graphical Editor Panel**: Visual editor for creating and arranging game scenes

### Data Synchronization

- Uses Yjs for real-time state synchronization
- WebSocket-based communication using the GlovesLink protocol
- Client-server state synchronization for collaborative editing
- Automatic conflict resolution through Yjs CRDT implementation

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

## Usage

Start the server:
```bash
tailpad-server
```

Build the game: (to publish)
```bash
tailpad-bundle
```

## Build configuration

The build configuration is defined in the `config.json5` file.

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
- **Valthera DB**: Persistent storage
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