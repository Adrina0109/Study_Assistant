"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import Select from "react-select";

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

  // Quiz states
  const [selected, setSelected] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Modal + Tags
  const [showModal, setShowModal] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>(["AI", "Biology", "Physics", "Exam Prep"]);

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

  // Save Note handler
  const handleSaveNote = async () => {
    if (!data) return;
    const userText = localStorage.getItem("userText") || "";

    const payload = {
      original_text: userText,
      summary: data.summary,
      key_points: data.key_points || [],
      quiz: data.quiz || [],
      mcqs: (data.mcqs || []).map((m) => ({
        question: m.question,
        explanation: m.explanation,
        options: (m.options || []).map((opt) => ({
          option_text: opt,
          is_correct: opt.toLowerCase() === (m.answer || "").toLowerCase(),
        })),
      })),
      tags: tags,
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/notes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("✅ Note saved successfully!");
        setShowModal(false);
        setTags([]);
      } else {
        const text = await res.text();
        console.error("Save failed response:", res.status, text);
        toast.error("❌ Failed to save note.");
      }
    } catch (err) {
      console.error(err);
      toast.error("⚠️ Server error while saving note.");
    }
  };

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

  const resetQuiz = () => {
    setSelected(new Array(data?.mcqs?.length || 0).fill(-1));
    setSubmitted(false);
    setScore(0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing Your Notes</h2>
          <p className="text-gray-600">AI is generating your study materials...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No Data Found</h2>
          <p className="text-gray-600 mb-6">Please go back and paste your study notes first.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Your AI Study Materials
          </h1>
          <p className="text-gray-600 text-lg">Explore your personalized learning content</p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8 flex flex-wrap gap-2 justify-center">
          {[
            { key: "summary", label: "Summary", icon: "file-alt" },
            { key: "key_points", label: "Key Points", icon: "list-check" },
            { key: "quiz", label: "Fill-in-the-Blanks", icon: "edit" },
            { key: "mcq", label: "Practice Quiz", icon: "question-circle" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
                activeTab === (t.key as any)
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
              }`}
            >
              <i className={`fas fa-${t.icon}`}></i>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Summary Tab */}
          {activeTab === "summary" && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-file-alt text-indigo-600"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">AI Summary</h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                  {data.summary}
                </p>
              </div>
            </div>
          )}

          {/* Key Points Tab */}
          {activeTab === "key_points" && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-list-check text-green-600"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Key Points</h2>
              </div>
              <div className="grid gap-4 p-6">
                {data.key_points.map((p, i) => (
                  <div key={i} className="flex items-start gap-4 bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 font-semibold mt-1">
                      {i + 1}
                    </div>
                    <p className="text-gray-700 text-lg">{p}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fill-in-the-Blanks Tab */}
          {activeTab === "quiz" && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-edit text-blue-600"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Fill-in-the-Blanks</h2>
              </div>
              <div className="space-y-6 p-6">
                {data.quiz.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                    <p>No fill-in-the-blank questions generated.</p>
                  </div>
                )}
                {data.quiz.map((q, i) => (
                  <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold mt-1">{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-lg mb-3">{q.question}</p>
                        <div className="bg-white rounded-lg p-4 border border-blue-100">
                          <p className="text-sm text-gray-600 mb-1">Correct Answer:</p>
                          <p className="font-bold text-blue-700 text-lg">{q.answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MCQs Tab */}
          {activeTab === "mcq" && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fas fa-question-circle text-purple-600"></i>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">Practice Quiz</h2>
                </div>
                {submitted && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                    Score: {score} / {data.mcqs.length}
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {data.mcqs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
                    <p>No multiple choice questions generated.</p>
                  </div>
                )}

                {data.mcqs.map((q, qi) => (
                  <div key={qi} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-semibold">{qi + 1}</div>
                        <p className="font-semibold text-gray-800 text-lg">{q.question}</p>
                      </div>

                      <div className="space-y-3">
                        {q.options.map((opt, oi) => {
                          const isSelected = selected[qi] === oi;
                          const isCorrect = opt.toLowerCase() === q.answer.toLowerCase();
                          const showColors = submitted && isSelected;
                          
                          return (
                            <label
                              key={oi}
                              className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                showColors
                                  ? isCorrect
                                    ? "bg-green-50 border-green-400 shadow-sm"
                                    : "bg-red-50 border-red-400 shadow-sm"
                                  : isSelected
                                  ? "bg-indigo-50 border-indigo-400"
                                  : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                              }`}
                            >
                              <input
                                type="radio"
                                className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                                name={`q-${qi}`}
                                checked={isSelected}
                                onChange={() => {
                                  if (!submitted) {
                                    const copy = [...selected];
                                    copy[qi] = oi;
                                    setSelected(copy);
                                  }
                                }}
                                disabled={submitted}
                              />
                              <span className={`font-medium ${showColors ? (isCorrect ? "text-green-800" : "text-red-800") : "text-gray-700"}`}>
                                {opt}
                              </span>
                              {showColors && (
                                <i className={`ml-auto fas ${isCorrect ? "fa-check text-green-600" : "fa-times text-red-600"}`}></i>
                              )}
                            </label>
                          );
                        })}
                      </div>

                      {submitted && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="font-medium text-blue-800 mb-2">
                            <i className="fas fa-lightbulb mr-2"></i>
                            Correct answer: <span className="font-bold">{q.answer}</span>
                          </p>
                          <p className="text-blue-700">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={submitted ? resetQuiz : checkAnswers}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                    submitted
                      ? "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-md"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                  }`}
                >
                  <i className={`fas ${submitted ? "fa-redo" : "fa-check"}`}></i>
                  {submitted ? "Try Again" : "Check Answers"}
                </button>
                
                {submitted && (
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-700">
                      {score === data.mcqs.length ? "Perfect! 🎉" :
                       score >= data.mcqs.length * 0.7 ? "Great job! 👍" :
                       "Keep practicing!"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Note Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <i className="fas fa-save mr-2"></i> Save Note
          </button>
        </div>
      </div>

      {/* Tag Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-[90%] max-w-md relative">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Add Tags</h2>
            <p className="text-gray-500 mb-4 text-sm">
              Choose existing tags or type new ones
            </p>
            <Select
              isMulti
              options={existingTags.map((t) => ({ value: t, label: t }))}
              value={tags.map((t) => ({ value: t, label: t }))}
              onChange={(selected) => setTags(selected.map((s) => s.value))}
              onCreateOption={(inputValue) => {
                if (!existingTags.includes(inputValue)) {
                  setExistingTags([...existingTags, inputValue]);
                }
                setTags([...tags, inputValue]);
              }}
              className="text-gray-800"
              placeholder="Add or select tags..."
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-medium text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
}
