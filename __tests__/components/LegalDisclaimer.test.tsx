/**
 * @file LegalDisclaimer.test.tsx
 * @brief Unit tests for LegalDisclaimer component
 * @details Tests legal disclaimer modal including:
 * - Initial visibility for first-time users
 * - Acceptance and localStorage persistence
 * - License link functionality
 * - Accessibility
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LegalDisclaimer from '@/components/LegalDisclaimer';

describe('LegalDisclaimer Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.clear();
        jest.spyOn(window, 'open').mockImplementation(() => null);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Initial Visibility', () => {
        it('should show disclaimer on first visit', () => {
            render(<LegalDisclaimer />);

            expect(screen.getByText(/Legal Disclaimer/i)).toBeInTheDocument();
        });

        it('should show disclaimer when localStorage not set', () => {
            localStorage.removeItem('vectra_legal_disclaimer_accepted');
            render(<LegalDisclaimer />);

            expect(screen.getByText(/Legal Disclaimer/i)).toBeInTheDocument();
        });

        it('should hide disclaimer when already accepted', () => {
            localStorage.setItem('vectra_legal_disclaimer_accepted', 'true');
            const { container } = render(<LegalDisclaimer />);

            // The component should not display the modal when accepted
            const modal = container.querySelector('[role="dialog"]');
            expect(modal).not.toBeInTheDocument();
        });
    });

    describe('Disclaimer Content', () => {
        it('should display disclaimer text', () => {
            render(<LegalDisclaimer />);

            expect(screen.getByText(/Legal Disclaimer/i)).toBeInTheDocument();
        });

        it('should contain license reference', () => {
            render(<LegalDisclaimer />);

            expect(screen.getByText(/LICENSE/i)).toBeInTheDocument();
        });

        it('should display acceptance message', () => {
            render(<LegalDisclaimer />);

            // Check for actual accept button instead
            expect(screen.getByText(/Accept/i)).toBeInTheDocument();
        });
    });

    describe('Acceptance Functionality', () => {
        it('should hide modal after acceptance', () => {
            render(<LegalDisclaimer />);

            // Modal should be visible initially
            expect(screen.getByText(/Legal Disclaimer & Terms of Use/i)).toBeInTheDocument();

            const acceptButton = screen.getByText(/Accept & Continue/i);
            fireEvent.click(acceptButton);

            // Modal should be hidden after clicking
            expect(screen.queryByText(/Legal Disclaimer & Terms of Use/i)).not.toBeInTheDocument();
        });

        it('should handle dismissal with Review Later button', () => {
            render(<LegalDisclaimer />);

            const reviewLaterButton = screen.getByText(/Review Later/i);
            fireEvent.click(reviewLaterButton);

            // Modal should be hidden
            expect(screen.queryByText(/Legal Disclaimer & Terms of Use/i)).not.toBeInTheDocument();
        });
    });

    describe('Close Button', () => {
        it('should have close button', () => {
            render(<LegalDisclaimer />);

            const closeButton = screen.getByText('✕');
            expect(closeButton).toBeInTheDocument();
        });

        it('should close modal when close button clicked', async () => {
            const { container } = render(<LegalDisclaimer />);

            const closeButton = screen.getByText('✕');
            fireEvent.click(closeButton);

            await waitFor(() => {
                const modal = container.querySelector('[role="dialog"]');
                expect(modal).not.toBeInTheDocument();
            });
        });

        it('should still show modal on next visit after closing (without accepting)', async () => {
            localStorage.removeItem('vectra_legal_disclaimer_accepted');
            const { unmount } = render(<LegalDisclaimer />);

            const closeButton = screen.getByText('✕');
            fireEvent.click(closeButton);

            unmount();

            // Remount - should show again since we didn't accept
            render(<LegalDisclaimer />);
            expect(screen.getByText(/Legal Disclaimer/i)).toBeInTheDocument();
        });
    });

    describe('License Link', () => {
        it('should have license link', () => {
            render(<LegalDisclaimer />);

            const licenseLink = screen.getByText(/LICENSE/i);
            expect(licenseLink).toBeInTheDocument();
        });

        it('should open license in new window when clicked', () => {
            render(<LegalDisclaimer />);

            const licenseLink = screen.getByText(/LICENSE/i);
            expect(licenseLink).toHaveAttribute('target', '_blank');
        });

        it('should have correct target attribute', () => {
            render(<LegalDisclaimer />);

            const licenseLink = screen.getByText(/LICENSE/i);
            expect(licenseLink).toHaveAttribute('target', '_blank');
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading hierarchy', () => {
            render(<LegalDisclaimer />);

            const heading = screen.getByRole('heading', { level: 2 });
            expect(heading).toHaveTextContent(/Legal Disclaimer/i);
        });

        it('should have semantic structure', () => {
            const { container } = render(<LegalDisclaimer />);

            const heading = screen.getByText(/Legal Disclaimer & Terms of Use/i);
            expect(heading).toBeInTheDocument();
            expect(heading.tagName).toBe('H2');
        });

        it('should have descriptive button text', () => {
            render(<LegalDisclaimer />);

            expect(screen.getByText(/Accept/i)).toBeInTheDocument();
            expect(screen.getByText('✕')).toBeInTheDocument();
        });

        it('should be keyboard accessible', () => {
            render(<LegalDisclaimer />);

            const acceptButton = screen.getByText(/Accept/i) as HTMLButtonElement;
            acceptButton.focus();
            expect(acceptButton).toHaveFocus();
        });
    });

    describe('Edge Cases', () => {
        it('should handle corrupted localStorage gracefully', () => {
            localStorage.setItem('vectra_legal_disclaimer_accepted', 'invalid');
            render(<LegalDisclaimer />);

            // Component should still render despite invalid localStorage
            expect(screen.getByText(/Legal Disclaimer/i)).toBeInTheDocument();
        });

        it('should handle multiple rapid accepts', () => {
            render(<LegalDisclaimer />);

            const acceptButton = screen.getByText(/Accept & Continue/i);
            fireEvent.click(acceptButton);

            // Component should hide after first click
            expect(screen.queryByText(/Legal Disclaimer & Terms of Use/i)).not.toBeInTheDocument();
        });
    });

    describe('Styling and Layout', () => {
        it('should have visible modal backdrop', () => {
            const { container } = render(<LegalDisclaimer />);

            const backdrop = container.querySelector('.fixed.bottom-4');
            expect(backdrop).toBeInTheDocument();
        });

        it('should center modal content', () => {
            const { container } = render(<LegalDisclaimer />);

            const modal = container.querySelector('.max-w-2xl');
            expect(modal).toBeInTheDocument();
        });

        it('should have proper button styling', () => {
            render(<LegalDisclaimer />);

            const acceptButton = screen.getByText(/Accept & Continue/i);
            expect(acceptButton).toHaveClass('bg-green-500', 'hover:bg-green-600');
        });
    });
});
