"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface IFlashcard {
    question: string;
    answer: string;
}

const Flashcards = () => {
    const router = useRouter();

    const [flashcards, setFlashcards] = useState<IFlashcard[]>([]);
    const [currCard, setCurrCard] = useState<IFlashcard>();
    const [visibleSide, setVisibleSide] = useState<number>(0);
    const [currIdx, setCurrIdx] = useState(0);

    useEffect(() => {
        if (!window) return;

        const localData = JSON.parse(
            localStorage.getItem("flashcards") || '{"flashcards": []}'
        ).flashcards;

        if (localData.length === 0) router.push("/");

        setFlashcards(localData);
        setCurrCard(localData[0]);
    }, [window]);

    useEffect(() => {
        if (currIdx >= flashcards.length - 1) return;
        setCurrCard(flashcards[currIdx]);
        setVisibleSide(0);
    }, [currIdx]);

    return (
        <main className="flex w-screen min-h-screen items-center justify-center flex-col gap-y-8">
            <div
                onClick={() => setVisibleSide((visibleSide + 1) % 2)}
                className="w-[400px] h-[300px] flex items-center justify-center flex-col bg-slate-200 text-black rounded-xl py-4 px-6 cursor-pointer gap-y-2"
            >
                <p className="font-bold">
                    {visibleSide % 2 === 0 ? "Question" : "Answer"}
                </p>
                <p className="text-left overflow-scroll">
                    {visibleSide % 2 === 0
                        ? currCard?.question
                        : currCard?.answer}
                </p>
            </div>
            <div className="flex flex-row items-center justify-center gap-x-8">
                <button
                    onClick={() => setCurrIdx(currIdx - 1)}
                    disabled={currIdx <= 0}
                    className="not-disabled:cursor-pointer disabled:opacity-0"
                >
                    <ArrowLeft />
                </button>
                <button
                    onClick={() => setCurrIdx(currIdx + 1)}
                    disabled={currIdx >= flashcards.length - 1}
                    className="not-disabled:cursor-pointer disabled:opacity-0"
                >
                    <ArrowRight />
                </button>
            </div>
        </main>
    );
};

export default Flashcards;
