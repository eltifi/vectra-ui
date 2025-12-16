/**
 * @file CookieConsent.test.tsx
 * @brief Unit tests for CookieConsent component
 * @details Tests GDPR cookie consent banner functionality including:
 * - Banner visibility and localStorage integration
 * - User interaction (accept/deny)
 * - Data persistence and cleanup
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CookieConsent from '@/components/CookieConsent';

describe('CookieConsent Component', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        jest.clearAllMocks();
    });

    describe('Banner Visibility', () => {
        it('should render nothing when cookie consent already accepted', () => {
            localStorage.setItem('vectra_cookie_consent', 'accepted');
            const { container } = render(<CookieConsent />);
            expect(container.firstChild).toBeNull();
        });

        it('should show banner when no consent found in localStorage', async () => {
            render(<CookieConsent />);
            await waitFor(() => {
                expect(screen.getByText(/Cookie Preferences/i)).toBeInTheDocument();
            });
        });

        it('should display accept and deny buttons', async () => {
            render(<CookieConsent />);
            await waitFor(() => {
                expect(screen.getByText(/Accept Cookies/i)).toBeInTheDocument();
                expect(screen.getByText(/Deny Cookies/i)).toBeInTheDocument();
            });
        });

        it('should display cookie policy information', async () => {
            render(<CookieConsent />);
            await waitFor(() => {
                expect(screen.getByText(/Essential Cookies/i)).toBeInTheDocument();
                expect(screen.getByText(/Preference Cookies/i)).toBeInTheDocument();
            });
        });
    });

    describe('Accept Functionality', () => {
        it('should set localStorage key when accepting', async () => {
            render(<CookieConsent />);
            const acceptButton = await screen.findByText(/Accept Cookies/i);
            fireEvent.click(acceptButton);

            expect(localStorage.getItem('vectra_cookie_consent')).toBe('accepted');
        });

        it('should hide banner after accepting', async () => {
            const { container } = render(<CookieConsent />);
            const acceptButton = await screen.findByText(/Accept Cookies/i);
            fireEvent.click(acceptButton);

            await waitFor(() => {
                expect(container.querySelector('.fixed')).not.toBeInTheDocument();
            });
        });

        it('should not show banner again after page reload when accepted', async () => {
            const { rerender } = render(<CookieConsent />);
            const acceptButton = await screen.findByText(/Accept Cookies/i);
            fireEvent.click(acceptButton);

            rerender(<CookieConsent />);

            await waitFor(() => {
                expect(screen.queryByText(/Cookie Preferences/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Deny Functionality', () => {
        it('should clear localStorage items when denying', async () => {
            localStorage.setItem('vectra_region', 'Tampa Bay');
            localStorage.setItem('vectra_scenario', 'cat3_tampa_bay');

            render(<CookieConsent />);
            const denyButton = await screen.findByText(/Deny Cookies/i);
            fireEvent.click(denyButton);

            expect(localStorage.getItem('vectra_region')).toBeNull();
            expect(localStorage.getItem('vectra_scenario')).toBeNull();
        });

        it('should not set consent key when denying', async () => {
            render(<CookieConsent />);
            const denyButton = await screen.findByText(/Deny Cookies/i);
            fireEvent.click(denyButton);

            expect(localStorage.getItem('vectra_cookie_consent')).toBeNull();
        });

        it('should show banner again after denying and page reload', async () => {
            const { unmount } = render(<CookieConsent />);
            const denyButton = await screen.findByText(/Deny Cookies/i);
            fireEvent.click(denyButton);

            unmount();

            // Banner should show again because no consent key was set
            render(<CookieConsent />);

            await waitFor(() => {
                expect(screen.getByText(/Cookie Preferences/i)).toBeInTheDocument();
            });
        });
    });

    describe('Privacy Policy Link', () => {
        it('should display privacy policy link', async () => {
            render(<CookieConsent />);
            const privacyLink = await screen.findByText(/Privacy Policy/i);
            expect(privacyLink).toBeInTheDocument();
        });

        it('should show alert when privacy policy link clicked', async () => {
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
            render(<CookieConsent />);
            const privacyLink = await screen.findByText(/Privacy Policy/i);
            fireEvent.click(privacyLink);

            expect(alertSpy).toHaveBeenCalledWith(
                expect.stringContaining('Privacy Policy')
            );
            alertSpy.mockRestore();
        });
    });

    describe('Accessibility', () => {
        it('should have proper semantic structure', async () => {
            render(<CookieConsent />);
            await waitFor(() => {
                const heading = screen.getByText(/Cookie Preferences/i);
                expect(heading.tagName).toBe('H2');
            });
        });

        it('buttons should be keyboard accessible', async () => {
            render(<CookieConsent />);
            const acceptButton = await screen.findByText(/Accept Cookies/i);
            // Buttons are elements that can be interacted with keyboard
            expect(acceptButton.tagName).toBe('BUTTON');
        });
    });
});
