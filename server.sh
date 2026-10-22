#!/bin/bash
if [ "$#" -gt 0 ]; then
	suglite -c bun server -w src/server.ts -- "$@"
else
	suglite -c bun server -w src/server.ts
fi
