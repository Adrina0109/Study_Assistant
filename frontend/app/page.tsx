"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [text, setText] = useState("");
  const router = useRouter();

  const handleSubmit = async () => {
    if (!text.trim()) return alert("Please enter some text");

    localStorage.setItem("userText", text);
    router.push("/result");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-xl p-8 max-w-3xl w-full">
        <h1 className="text-3xl font-bold text-center mb-4 text-indigo-600">
          Smart AI Study Assistant
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Paste your notes below and let AI summarize & generate quizzes for you 📚
        </p>

        <textarea
        className="w-full h-60 border border-gray-300 rounded-lg p-4 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Paste or type your study notes here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        />


        <button
          onClick={handleSubmit}
          className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition"
        >
          Generate Summary
        </button>
      </div>
    </div>
  );
}
