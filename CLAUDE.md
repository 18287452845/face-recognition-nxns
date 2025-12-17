# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NXNS (云匹配识别系统) is a face recognition and analysis system built with pure Node.js. It captures user photos via webcam, analyzes them using Aliyun DashScope's AI model (qwen-vl-max), matches them with celebrities, and provides health recommendations in a sci-fi HUD interface.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server with auto-reload
npm run dev

# Run production server
npm start

# Note: No test suite is currently implemented
```

## Architecture

### Backend Architecture

The backend follows a **layered service architecture**:

1. **Controllers Layer** (`server/controllers/`): Handle HTTP requests and responses
2. **Services Layer** (`server/services/`): Core business logic and external API integrations
3. **Utils Layer** (`server/utils/`): Reusable utility functions
4. **Routes** (`server/routes/`): API endpoint definitions
5. **Middleware** (`server/middleware/`): Express middleware for error handling

### Key Services

- **AiService**: Interfaces with Aliyun DashScope API for face analysis
- **FaceAnalysisService**: Orchestrates analysis workflow and manages caching
- **CelebrityService**: Manages celebrity photo database and matching
- **ImageUtils**: Handles image processing, compression, and file operations

### Frontend Architecture

Pure client-side JavaScript with a modular structure:
- `webcam.js`: Camera control and capture functionality
- `upload.js`: File upload handling with drag-and-drop support
- `result.js`: Results display with HUD animations

## Essential Setup

### Environment Variables

Create `.env` from `.env.example` with these required variables:

```env
# Required for AI analysis
ALIYUN_API_KEY=your_dashscope_api_key
ALIYUN_BASE_URL=https://dashscope.aliyuncs.com

# Optional configuration
PORT=3000
ALIYUN_MODEL=qwen-vl-max
ALIYUN_ENDPOINT=/compatible-mode/v1/chat/completions
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ANALYSIS_TIMEOUT=30000
```

### Directory Setup

Create these directories before running:

```
celebrities/male/     # Add male celebrity photos
celebrities/female/   # Add female celebrity photos
uploads/              # Auto-created for user uploads
```

## Key Implementation Details

### API Flow

1. Image upload → `/api/upload` or `/api/upload/file`
2. Face analysis → `/api/analyze` (synchronous)
3. Results displayed on `/result` page

### Celebrity Matching

The system uses a simple random matching algorithm with gender-based filtering:
- Celebrity photos should be named as: `Name-Description.jpg`
- Files are organized by gender in `celebrities/male/` and `celebrities/female/`
- The service returns a random celebrity with a simulated similarity score (65-95%)

### Caching Strategy

- **Analysis Results**: In-memory Map cache (max 100 entries)
- **Celebrity Data**: Cached for 5 minutes to reduce filesystem reads
- No persistent caching - restart clears all cache

### Image Processing

- All uploaded images are compressed (max 800x600, quality 80%)
- Supports JPEG, PNG, WebP formats
- Temporary files are auto-cleaned every hour

### Error Handling

- Comprehensive error handling middleware in `server/middleware/errorHandler.js`
- Custom `AppError` class for operational errors
- Consistent JSON response format via `responseHelper.js`

## Frontend Features

### Camera Access

- Uses `navigator.mediaDevices.getUserMedia()` API
- Supports front/back camera switching on mobile
- Implements 3-second countdown with animation
- Falls back to file upload if camera denied

### HUD Interface

- Sci-fi themed with CSS animations
- Responsive design for mobile/desktop
- Real-time data loading effects
- Typewriter text animation for results

## Development Notes

### Adding New Celebrity Photos

1. Place images in appropriate gender directory
2. Name format: `明星姓名-描述.jpg`
3. Supported formats: jpg, jpeg, png, webp
4. System will automatically detect new files

### Modifying AI Prompt

Edit the `prompt` variable in `server/services/aiService.js` `analyzeFace()` method to change analysis parameters.

### Debugging Tips

- Check `ALIYUN_API_KEY` is properly set if AI analysis fails
- Celebrity photos must be in correct directory structure
- Use browser dev tools to check console for frontend errors
- Server logs show detailed error information

## Limitations

- No database - uses file system storage
- Celebrity matching is random (not actual facial recognition)
- No user authentication or data persistence
- Analysis results cached in memory only

## Security Considerations

- API key never exposed to frontend
- File upload size limited (10MB default)
- Image type validation enforced
- Temporary files auto-cleaned