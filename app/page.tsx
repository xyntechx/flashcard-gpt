"use client";

import clsx from "clsx";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
    const router = useRouter();

    const [file, setFile] = useState<File>();
    const [attemptedUpload, setAttemptedUpload] = useState<boolean>();
    const [success, setSuccess] = useState<boolean>();
    const [loading, setLoading] = useState<boolean>(false);
    const [question, setQuestion] = useState<string>(
        "Generate flashcards from this document"
    );

    const uploadFile = (e: any) => {
        setAttemptedUpload(true);
        const f = e.target.files[0];
        if (f.type !== "application/pdf") {
            setSuccess(false);
            return;
        }
        setFile(f);
        setSuccess(true);
        console.log(f);
    };

    const callChat = async () => {
        if (!file) {
            console.error("No file selected");
            return;
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("question", question);

            const res = await fetch("/api/chat", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            console.log(data);
            localStorage.setItem("flashcards", data.message);
            router.push("/flashcards");
        } catch (error) {
            console.error("Error calling chat API:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex w-screen min-h-screen items-center justify-center flex-col gap-y-4">
            {attemptedUpload && (
                <div
                    className={clsx(
                        success ? "bg-green-600" : "bg-red-600",
                        "w-full flex items-center justify-center absolute top-0 text-white py-2"
                    )}
                >
                    {success ? "Upload successful" : "Please upload a PDF"}
                </div>
            )}
            <h1 className="text-2xl font-bold">FlashcardGPT</h1>

            <div className="flex items-center justify-center flex-col gap-y-2 w-1/2">
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What would you like me to do with this document?"
                    className="p-2 border rounded-sm resize-none h-20 text-white border-white outline-none w-full"
                    disabled={loading}
                />
                <label
                    htmlFor="file-upload"
                    className="py-2 px-4 bg-blue-500 rounded-sm cursor-pointer hover:shadow hover:shadow-blue-400 transition-shadow text-center"
                >
                    Upload your notes
                </label>
                <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={(e) => uploadFile(e)}
                />
            </div>
            <button
                onClick={async () => await callChat()}
                disabled={!file || loading}
                className="py-2 px-4 bg-blue-500 rounded-sm disabled:cursor-not-allowed not-disabled:cursor-pointer not-disabled:hover:shadow not-disabled:hover:shadow-blue-400 transition-shadow text-center disabled:bg-slate-800"
            >
                {loading ? "Generating..." : "Generate"}
            </button>
            {file && (
                <p className="text-sm text-gray-600">
                    Selected: {file.name} (
                    {(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
            )}
        </main>
    );
}
