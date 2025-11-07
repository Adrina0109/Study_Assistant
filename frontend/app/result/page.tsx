"use client";

import { useEffect, useState } from "react";

type MCQ = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type ApiResult = {
  summary: string;
  key_points: string[];
  quiz: { question: string; answer: string }[];
  mcqs: MCQ[];
};

export default function ResultPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "key_points" | "quiz" | "mcq">("summary");
  const [data, setData] = useState<ApiResult | null>(null);

  // MCQ state
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const userText = localStorage.getItem("userText");
    if (!userText) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/process-text", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: userText }),
        });
        const result: ApiResult = await res.json();
        setData(result);
        setSelected(new Array(result?.mcqs?.length || 0).fill(-1));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const checkAnswers = () => {
    if (!data?.mcqs) return;
    let sc = 0;
    data.mcqs.forEach((q, i) => {
      const pick = selected[i];
      if (pick >= 0 && q.options[pick]?.toLowerCase() === q.answer.toLowerCase()) sc++;
    });
    setScore(sc);
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        ⏳ Processing your text, please wait...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold">
        No data. Go back and paste your notes.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 flex justify-center">
      <div className="bg-white shadow-xl p-8 rounded-xl max-w-3xl w-full text-gray-800">
        <h1 className="text-2xl font-bold text-indigo-600 mb-6 text-center">
          📘 Your AI-Generated Study Material
        </h1>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 justify-center">
          {[
            { key: "summary", label: "Summary" },
            { key: "key_points", label: "Key Points" },
            { key: "quiz", label: "Fill-in-the-Blanks" },
            { key: "mcq", label: "MCQs" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === (t.key as any)
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Summary */}
        {activeTab === "summary" && (
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {data.summary}
          </p>
        )}

        {/* Key Points */}
        {activeTab === "key_points" && (
          <ul className="list-disc pl-6 space-y-2 text-gray-800">
            {data.key_points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        )}

        {/* Fill-in-the-Blanks */}
        {activeTab === "quiz" && (
          <div className="space-y-4">
            {data.quiz.length === 0 && <p className="text-gray-600">No questions generated.</p>}
            {data.quiz.map((q, i) => (
              <div key={i} className="bg-gray-100 p-4 rounded-lg">
                <p className="font-semibold mb-2">Q{i + 1}. {q.question}</p>
                <p className="text-sm text-gray-700">
                  ✅ Answer: <span className="font-bold">{q.answer}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* MCQs */}
        {activeTab === "mcq" && (
          <div className="space-y-5">
            {data.mcqs.length === 0 && <p className="text-gray-600">No MCQs generated.</p>}

            {data.mcqs.map((q, qi) => (
              <div key={qi} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="font-semibold mb-3">Q{qi + 1}. {q.question}</p>

                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const isSelected = selected[qi] === oi;
                    const isCorrect = opt.toLowerCase() === q.answer.toLowerCase();
                    const showColors = submitted && isSelected;
                    return (
                      <label
                        key={oi}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer border
                          ${showColors ? (isCorrect ? "bg-green-100 border-green-400" : "bg-red-100 border-red-400") : "bg-white border-gray-200"}`}
                      >
                        <input
                          type="radio"
                          className="accent-indigo-600"
                          name={`q-${qi}`}
                          checked={isSelected}
                          onChange={() => {
                            const copy = [...selected];
                            copy[qi] = oi;
                            setSelected(copy);
                          }}
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>

                {submitted && (
                  <div className="mt-3 text-sm">
                    <p className="font-medium">
                      Correct answer: <span className="text-green-700">{q.answer}</span>
                    </p>
                    <p className="text-gray-700 mt-1">💡 {q.explanation}</p>
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between">
              <button
                onClick={checkAnswers}
                className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                {submitted ? "Recheck" : "Check Answers"}
              </button>
              {submitted && (
                <div className="font-semibold">
                  Score: <span className="text-indigo-700">{score}</span> / {data.mcqs.length}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
