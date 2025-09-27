import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const Card = z.object({
    question: z.string(),
    answer: z.string(),
});

const Flashcards = z.object({
    flashcards: z.array(Card),
});

const sampleData = {
    flashcards: [
        {
            question: "What is the main focus of Lecture 7?",
            answer: "The lecture focuses on the Muon optimizer, which builds on ideas from Shampoo and Newton-Schulz iterations for efficient optimization.",
        },
        {
            question:
                "In optimization, what does the term <∇w l(W), ΔW> represent?",
            answer: "It represents the inner product between the gradient of loss and the change in weights.",
        },
        {
            question:
                "What norm does Shampoo typically use for optimization updates?",
            answer: "Shampoo uses the spectral norm, involving matrix factorization with UΣVᵀ.",
        },
        {
            question: "What is the key update in Shampoo without accumulation?",
            answer: "W_{t+1} = W_t - η (G_t G_tᵀ)^(-1/4) G_t (G_tᵀ G_t)^(-1/4).",
        },
        {
            question: "What is Muon Key Idea 1?",
            answer: "Use semi-orthogonal updates, where matrices are normalized to give uniform steps in all directions, not dominated by the largest singular value.",
        },
        {
            question:
                "Why are semi-orthogonal matrices useful in optimization?",
            answer: "They ensure a good condition number (UVᵀ ≈ 1) and provide balanced updates across directions.",
        },
        {
            question: "What is the computational challenge in computing UVᵀ?",
            answer: "It requires Singular Value Decomposition (SVD), which is expensive.",
        },
        {
            question: "What is Muon Key Idea 2?",
            answer: "Approximate UΣVᵀ ≈ UVᵀ using Newton-Schulz iterations, replacing singular values with 1.",
        },
        {
            question:
                "What polynomial p(x) is used in Newton-Schulz iterations to approximate the inverse square root?",
            answer: "p(x) = (3/2)x - (1/2)x^3.",
        },
        {
            question: "What does the acronym Muon stand for?",
            answer: "Momentum Orthogonalized by Newton-Schulz.",
        },
    ],
};

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

export async function GET() {
    return Response.json({ message: "Hello World" });
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const userQuestion =
            (formData.get("question") as string) ||
            "Generate flashcards from this document";

        if (!file) {
            return Response.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        if (file.type !== "application/pdf") {
            return Response.json(
                {
                    error: "Invalid file type. Only images and PDFs are supported.",
                },
                { status: 400 }
            );
        }

        const timestamp = Date.now();
        const filename = `${timestamp}-${file.name.replace(
            /[^a-zA-Z0-9.-]/g,
            "_"
        )}`;
        const filepath = path.join(uploadsDir, filename);

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        fs.writeFileSync(filepath, buffer);

        try {
            console.log("Uploading file to OpenAI...");
            const uploadedFile = await client.files.create({
                file: fs.createReadStream(filepath),
                purpose: "user_data",
            });

            console.log("File uploaded to OpenAI with ID:", uploadedFile.id);

            // const response = await client.responses.parse({
            //     model: "gpt-5-mini",
            //     input: [
            //         {
            //             role: "user",
            //             content: [
            //                 {
            //                     type: "input_file",
            //                     file_id: uploadedFile.id,
            //                 },
            //                 {
            //                     type: "input_text",
            //                     text: userQuestion,
            //                 },
            //             ],
            //         },
            //     ],
            //     text: {
            //         format: zodTextFormat(Flashcards, "flashcards"),
            //     },
            // });

            // Clean up temporary file
            fs.unlinkSync(filepath);

            return Response.json({
                // message: JSON.stringify(response.output_parsed || sampleData),
                message: JSON.stringify(sampleData),
                fileId: uploadedFile.id,
                filename: file.name,
                size: file.size,
            });
        } catch (openaiError) {
            console.error("OpenAI API error:", openaiError);

            // Clean up temporary file on error
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }

            return Response.json(
                {
                    error: "Error processing file with OpenAI",
                    details:
                        openaiError instanceof Error
                            ? openaiError.message
                            : "Unknown error",
                },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error in POST handler:", error);
        return Response.json(
            {
                error: "Server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
