"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, Send, Trash2, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getHelpReply, helpTopics, helpWelcome, HELP_MESSAGE_LIMIT, type HelpReply } from "@/lib/help-chat";
import styles from "./help-chat.module.css";

type Message = HelpReply & { id: number; speaker: "You" | "AJ guide" };

export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const sequence = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [open, messages]);

  function send(value: string) {
    const text = value.trim();
    if (!text || text.length > HELP_MESSAGE_LIMIT) return;
    const question: Message = { id: ++sequence.current, speaker: "You", text, links: [] };
    const answer: Message = { id: ++sequence.current, speaker: "AJ guide", ...getHelpReply(text) };
    setMessages((current) => [...current, question, answer].slice(-40));
    setDraft("");
    setAnnouncement("");
    input.current?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    send(draft);
  }

  function clear() {
    setMessages([]);
    setDraft("");
    setAnnouncement("Chat cleared.");
    input.current?.focus();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={styles.launcher}>
          <MessageCircle aria-hidden="true" size={20} />
          <span>Chat for Help</span>
        </button>
      </DialogTrigger>
      <DialogContent className={styles.panel} showCloseButton={false} onOpenAutoFocus={(event) => {
        event.preventDefault();
        input.current?.focus();
      }}>
        <header className={styles.header}>
          <div className={styles.heading}>
            <MessageCircle aria-hidden="true" size={24} />
            <div>
              <DialogTitle className={styles.title}>Chat for Help</DialogTitle>
              <span className={styles.subtitle}>AJ Climate Controls · Guided help</span>
            </div>
          </div>
          <div className={styles.controls}>
            <button type="button" className={styles.iconButton} onClick={clear} aria-label="Clear chat" title="Clear chat" disabled={!messages.length && !draft}>
              <Trash2 aria-hidden="true" size={18} />
            </button>
            <DialogClose asChild>
              <button type="button" className={styles.iconButton} aria-label="Close help chat"><X aria-hidden="true" size={20} /></button>
            </DialogClose>
          </div>
        </header>
        <DialogDescription className={styles.disclosure}>
          Prewritten guidance, not AI or live support. This chat cannot diagnose equipment or handle emergencies.
        </DialogDescription>
        <div ref={log} className={styles.log} role="log" aria-label="Help conversation" aria-live="polite" aria-relevant="additions" tabIndex={0}>
          <div className={styles.message}>
            <span className={styles.speaker}>AJ guide</span>
            <p>{helpWelcome.text}</p>
          </div>
          {messages.map((message) => (
            <div key={message.id} className={`${styles.message} ${message.speaker === "You" ? styles.userMessage : ""}`}>
              <span className={styles.speaker}>{message.speaker}</span>
              <p>{message.text}</p>
              {message.links.length > 0 && <ul className={styles.links}>
                {message.links.map((link) => <li key={link.href}>
                  {link.href.startsWith("mailto:") ? (
                    <a href={link.href}>{link.label}<ArrowUpRight size={15} aria-hidden="true" /></a>
                  ) : (
                    <Link href={link.href} onClick={() => setOpen(false)}>{link.label}<ArrowUpRight size={15} aria-hidden="true" /></Link>
                  )}
                </li>)}
              </ul>}
            </div>
          ))}
        </div>
        <div className={styles.footer}>
          <div className={styles.topics} aria-label="Suggested help topics">
            {helpTopics.map((topic) => <button key={topic} type="button" onClick={() => send(topic)}>{topic}</button>)}
          </div>
          <form onSubmit={submit} className={styles.form}>
            <label htmlFor="help-chat-message">Your question</label>
            <div className={styles.composer}>
              <input ref={input} id="help-chat-message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Try: boiler flow or work orders" maxLength={HELP_MESSAGE_LIMIT} autoComplete="off" aria-describedby="help-chat-privacy help-chat-limit" />
              <button type="submit" className={styles.send} disabled={!draft.trim()} aria-label="Send message"><Send size={19} aria-hidden="true" /></button>
            </div>
            <span id="help-chat-limit" className={styles.limit}>{draft.length}/{HELP_MESSAGE_LIMIT}</span>
          </form>
          <p id="help-chat-privacy" className={styles.privacy}>Messages stay in this page and clear on refresh. Do not share passwords or sensitive site details.</p>
          <span className="sr-only" role="status">{announcement}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
