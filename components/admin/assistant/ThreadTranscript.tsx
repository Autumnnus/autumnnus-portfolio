"use client";

import { AssistantMessage, UserMessage } from "@/components/assistant/MessageView";
import type { AssistantUIMessage } from "@/lib/ai/agent/portfolio-agent";

/** Read-only replay of a stored conversation with the same renderer visitors saw. */
export default function ThreadTranscript({
  messages,
  locale,
  ownerName,
}: {
  messages: AssistantUIMessage[];
  locale: string;
  ownerName: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {messages.map((message) =>
        message.role === "user" ? (
          <UserMessage key={message.id} message={message} />
        ) : (
          <AssistantMessage
            key={message.id}
            message={message}
            locale={locale}
            ownerName={ownerName}
            streaming={false}
            busy
            onApproval={() => {}}
          />
        ),
      )}
    </div>
  );
}
