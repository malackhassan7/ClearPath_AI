import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatbotPage } from "@/features/chatbot/ChatbotPage";
import { httpClient } from "@/api/httpClient";

describe("ChatbotPage Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders intro message and grounded badge", () => {
    render(<ChatbotPage />);
    expect(screen.getByText(/ClearPath-AI Compliance Assistant/i)).toBeInTheDocument();
    expect(screen.getByText(/Grounded RAG/i)).toBeInTheDocument();
  });

  it("sends question through httpClient and renders fail-closed answer when no sources verified", async () => {
    const user = userEvent.setup();
    const mockPost = vi.spyOn(httpClient, "post").mockResolvedValueOnce({
      data: {
        answer: "No verified regulatory sources are currently available for this query.",
        sources: [],
        language: "en",
        conversation_id: "conv-123",
      },
    });

    render(<ChatbotPage />);
    const input = screen.getByPlaceholderText(/Ask about FSSAI registration/i);
    await user.type(input, "What is the fee?");

    const sendBtn = screen.getByRole("button", { name: /Send/i });
    await user.click(sendBtn);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        "/chatbot/chat",
        expect.objectContaining({ question: "What is the fee?", language: "en" })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/No verified regulatory sources are currently available/i)
      ).toBeInTheDocument();
    });
  });

  it("renders source citations when verified evidence is returned", async () => {
    const user = userEvent.setup();
    vi.spyOn(httpClient, "post").mockResolvedValueOnce({
      data: {
        answer: "According to verified regulatory sources, units up to 500 LPD require registration.",
        sources: [
          {
            document_title: "Kind of Business Eligibility",
            page_number: 1,
            source_url: "https://foscos.fssai.gov.in/assets/docs/KindofBusinessEligibility.pdf",
            source_org: "FSSAI",
          },
        ],
        language: "en",
        conversation_id: "conv-456",
      },
    });

    render(<ChatbotPage />);
    const input = screen.getByPlaceholderText(/Ask about FSSAI registration/i);
    await user.type(input, "Registration capacity");

    const sendBtn = screen.getByRole("button", { name: /Send/i });
    await user.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Kind of Business Eligibility/i)).toBeInTheDocument();
      expect(screen.getByText(/Page 1/i)).toBeInTheDocument();
    });
  });
});
