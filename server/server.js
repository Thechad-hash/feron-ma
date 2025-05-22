import fs from 'fs';
import path from 'path';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';

const app = express();

// allow all origins (simple default CORS)
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  global.lastUploadedImagePath = req.file.path; // Save the file path globally for the next /api/feron call

  res.status(200).json({
    message: 'File uploaded successfully',
    fileName: req.file.originalname
  });
});


app.post('/api/feron', async (req, res) => {
  try {
    const { messages } = req.body;

    let model = "gpt-4o";//gpt-3.5-turbo
    let finalMessages = [
      { role: 'system', content: 'You are FERON, a manufacturing assistant for any part of the manufacturing industry, here to help anyone in the mission at hand...' }, 
      ...messages
    ];

    // 🔍 Check if an image was uploaded
    if (global.lastUploadedImagePath) {
      const imageBuffer = fs.readFileSync(path.resolve(global.lastUploadedImagePath));
      const base64Image = imageBuffer.toString('base64');

      model = "gpt-4o"; // switch model!

      finalMessages = [
        {
          role: "user",
          content: [
            { type: "text", text: "Here's an image the user uploaded. Please analyze it." },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ];

      // Clear the file after using (optional)
      fs.unlinkSync(global.lastUploadedImagePath);
      global.lastUploadedImagePath = null;
    }

    const response = await openai.chat.completions.create({
      model,
      messages: finalMessages,
      max_tokens: 1000
    });

    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error("FERON Error:", err);
    res.status(500).json({ error: "Internal error" });
  }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FERON backend running at http://localhost:${PORT}`);
});
