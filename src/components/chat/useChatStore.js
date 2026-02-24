// src/components/chat/useChatStore.js
"use client";

import { useCallback, useMemo, useReducer } from "react";
import { getOrCreateSessionId } from "@/lib/chat/session";
import { sendChat } from "@/lib/chat/chatClient";

function uid() {
  return `m_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toHistory(messages, limit = 12) {
  const tail = messages.slice(-limit);
  return tail.map((m) => ({
    role: m.role,
    content: m.text,
  }));
}

const initialState = {
  sessionId: "",
  messages: [],
  isLoading: false,
  error: "",
};

function safeArr(x) {
  return Array.isArray(x) ? x : [];
}

function reducer(state, action) {
  switch (action.type) {
    case "INIT":
      return { ...state, sessionId: action.sessionId };

    case "USER":
      return {
        ...state,
        error: "",
        messages: [
          ...state.messages,
          { id: uid(), role: "user", text: action.text, createdAt: Date.now() },
        ],
      };

    case "ASSISTANT":
      return {
        ...state,
        messages: [
          ...state.messages,
          {
            id: uid(),
            role: "assistant",
            text: action.text,
            createdAt: Date.now(),
            quickReplies: safeArr(action.quickReplies),
            courses: safeArr(action.courses),
            promotions: safeArr(action.promotions),
          },
        ],
      };

    case "LOADING":
      return { ...state, isLoading: action.value };

    case "ERROR":
      return { ...state, error: action.error || "" };

    case "RESET":
      return { ...initialState, sessionId: state.sessionId };

    default:
      return state;
  }
}

export function useChatStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const init = useCallback(() => {
    const sessionId = getOrCreateSessionId();
    dispatch({ type: "INIT", sessionId });
  }, []);

  const send = useCallback(
    async (text) => {
      const msg = String(text || "").trim();
      if (!msg) return;

      if (!state.sessionId) {
        const sessionId = getOrCreateSessionId();
        dispatch({ type: "INIT", sessionId });
      }

      dispatch({ type: "USER", text: msg });
      dispatch({ type: "LOADING", value: true });
      dispatch({ type: "ERROR", error: "" });

      try {
        const nextMessages = [...state.messages, { role: "user", text: msg }];

        const result = await sendChat({
          sessionId: state.sessionId || getOrCreateSessionId(),
          message: msg,
          history: toHistory(nextMessages),
        });

        dispatch({
          type: "ASSISTANT",
          text: result.reply || "",
          quickReplies: result.quickReplies,
          courses: result.courses,
          promotions: result.promotions,
        });
      } catch (e) {
        dispatch({ type: "ERROR", error: e?.message || "Chat failed" });
        dispatch({
          type: "ASSISTANT",
          text: "ขออภัย ระบบแชตมีปัญหาชั่วคราว ลองใหม่อีกครั้งได้ไหมครับ",
          quickReplies: [],
          courses: [],
          promotions: [],
        });
      } finally {
        dispatch({ type: "LOADING", value: false });
      }
    },
    [state.messages, state.sessionId],
  );

  const lastAssistant = useMemo(() => {
    for (let i = state.messages.length - 1; i >= 0; i--) {
      const m = state.messages[i];
      if (m.role === "assistant") return m;
    }
    return null;
  }, [state.messages]);

  return {
    ...state,
    init,
    send,
    reset: () => dispatch({ type: "RESET" }),
    lastAssistant,
  };
}
