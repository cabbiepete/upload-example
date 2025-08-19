# React File Upload

_A robust React file upload solution with support for nested data structures_

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/myhr/v0-react-file-upload)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/gOcGpPAcgJ5)

## Overview

This repository demonstrates various approaches to file uploading in React applications, with a focus on handling complex nested data structures. It features multiple implementation options including SWR and React Query, with solutions for managing state during asynchronous operations.

### Key Features

- Multiple file upload with drag-and-drop support
- Progress tracking during uploads
- Handling nested data structures
- Different state management approaches (useState, SWR, React Query)
- Optimistic UI updates

### Nested Data Structure Solution

The project includes a robust solution for handling file uploads within deeply nested data structures, solving common issues with state management during async operations. The key solution uses mutation with callbacks to ensure each operation is working with the most current data, preventing race conditions and ensuring data consistency.

[Watch Demo Video](docs/working-nested-object-update.mov)

For more details on the file upload implementation, see [File Upload Documentation](README-file-upload.md).

## Deployment

Your project is live at:

**[https://vercel.com/myhr/v0-react-file-upload](https://vercel.com/myhr/v0-react-file-upload)**

## Implementation Options

This project demonstrates several approaches to file uploading in React:

1. **Standard Upload** - Basic implementation using fetch API
2. **React Query Upload** - Using React Query for state management
3. **Nested Data Structure** - Complex implementation for deeply nested data
4. **Binary Upload** - Optimized for larger files

For a detailed comparison of these approaches, visit `/comparison` in the app.

## Documentation

- [File Upload Implementation Guide](README-file-upload.md) - Detailed documentation about components, hooks, and implementation approaches
- [Demo Video](docs/working-nested-object-update.mov) - Screen recording showing the nested data structure solution in action

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
