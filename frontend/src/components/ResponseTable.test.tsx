import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ResponseTable } from "./ResponseTable";
import type { HttpResponse } from "../types";

describe("ResponseTable Component", () => {
  // ==================== Mock Data ====================

  const mockResponses: HttpResponse[] = [
    {
      _id: "1",
      url: "https://httpbin.org/anything",
      statusCode: 200,
      requestPayload: { requestId: "test-123" } as Record<string, unknown>,
      responseData: { success: true } as Record<string, unknown>,
      headers: { "content-type": "application/json" } as Record<
        string,
        unknown
      >,
      responseTime: 150,
      timestamp: "2024-01-15T10:30:00Z",
    },
    {
      _id: "2",
      url: "https://httpbin.org/anything",
      statusCode: 500,
      requestPayload: { requestId: "test-456" } as Record<string, unknown>,
      responseData: { error: "Server error" } as Record<string, unknown>,
      headers: {} as Record<string, unknown>,
      responseTime: 3000,
      error: "Internal Server Error",
      timestamp: "2024-01-15T10:25:00Z",
    },
    {
      _id: "3",
      url: "https://httpbin.org/anything",
      statusCode: 0,
      requestPayload: { requestId: "test-789" } as Record<string, unknown>,
      responseData: {} as Record<string, unknown>,
      headers: {} as Record<string, unknown>,
      responseTime: 0,
      error: "Connection failed",
      timestamp: "2024-01-15T10:20:00Z",
    },
  ];

  // ==================== Loading State Tests ====================

  it("should render loading state", () => {
    render(
      <ResponseTable
        responses={[]}
        loading={true}
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText(/loading responses/i)).toBeInTheDocument();
  });

  // ==================== Empty State Tests ====================

  it("should render empty state when no responses", () => {
    render(
      <ResponseTable
        responses={[]}
        loading={false}
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText(/no responses yet/i)).toBeInTheDocument();
  });

  // ==================== Data Rendering Tests ====================

  it("should render response data correctly", () => {
    render(
      <ResponseTable
        responses={mockResponses}
        loading={false}
        currentPage={1}
        totalPages={2}
        onPageChange={vi.fn()}
      />
    );

    // Check status codes are displayed using aria-label for better matching
    expect(screen.getByLabelText("Status: 200")).toBeInTheDocument();
    expect(screen.getByLabelText("Status: 500")).toBeInTheDocument();
    expect(screen.getByLabelText("Status: 0")).toBeInTheDocument();

    // Check response times are displayed
    expect(screen.getByText("150ms")).toBeInTheDocument();
    expect(screen.getByText("3000ms")).toBeInTheDocument();

    // Check request IDs are displayed
    expect(screen.getByText("test-123")).toBeInTheDocument();
  });

  // ==================== Row Expansion Tests ====================

  it("should expand row details when details button clicked", () => {
    render(
      <ResponseTable
        responses={mockResponses}
        loading={false}
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    const detailsButtons = screen.getAllByText(/▼ details/i);
    fireEvent.click(detailsButtons[0]);

    // Check if expanded content is visible
    expect(screen.getByText(/request payload/i)).toBeInTheDocument();
    expect(screen.getByText(/response data/i)).toBeInTheDocument();
  });

  it("should collapse row when hide button clicked", () => {
    render(
      <ResponseTable
        responses={mockResponses}
        loading={false}
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    const detailsButtons = screen.getAllByText(/▼ details/i);
    fireEvent.click(detailsButtons[0]);

    // Now find the hide button
    const hideButton = screen.getByText(/▲ hide/i);
    fireEvent.click(hideButton);

    // Details should be hidden again
    expect(screen.queryByText(/request payload/i)).not.toBeInTheDocument();
  });

  // ==================== Pagination Tests ====================

  it("should call onPageChange with correct page number", () => {
    const mockPageChange = vi.fn();

    render(
      <ResponseTable
        responses={mockResponses}
        loading={false}
        currentPage={1}
        totalPages={3}
        onPageChange={mockPageChange}
      />
    );

    const nextButton = screen.getByText(/next/i);
    fireEvent.click(nextButton);

    expect(mockPageChange).toHaveBeenCalledWith(2);
  });

  it("should disable previous button on first page", () => {
    render(
      <ResponseTable
        responses={mockResponses}
        loading={false}
        currentPage={1}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const prevButton = screen.getByText(/previous/i);
    expect(prevButton).toBeDisabled();
  });

  it("should disable next button on last page", () => {
    render(
      <ResponseTable
        responses={mockResponses}
        loading={false}
        currentPage={3}
        totalPages={3}
        onPageChange={vi.fn()}
      />
    );

    const nextButton = screen.getByText(/next/i);
    expect(nextButton).toBeDisabled();
  });

  it("should display correct page info", () => {
    render(
      <ResponseTable
        responses={mockResponses}
        loading={false}
        currentPage={2}
        totalPages={5}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  });

  // ==================== Error Display Tests ====================

  it("should show error section when error exists", () => {
    render(
      <ResponseTable
        responses={mockResponses}
        loading={false}
        currentPage={1}
        totalPages={1}
        onPageChange={vi.fn()}
      />
    );

    // Expand the row with error
    const detailsButtons = screen.getAllByText(/▼ details/i);
    fireEvent.click(detailsButtons[1]); // Second row has error

    expect(screen.getByText(/error details/i)).toBeInTheDocument();
    expect(screen.getByText("Internal Server Error")).toBeInTheDocument();
  });
});
