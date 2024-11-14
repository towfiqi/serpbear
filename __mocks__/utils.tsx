import { render } from '@testing-library/react';
import { http } from 'msw';
import * as React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

export const handlers = [
    http.get(
        '*/react-query',
        ({ request, params }) => {
            return new Response(
                JSON.stringify({
                    name: 'mocked-react-query',
                }),
                {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                },
            );
        },
    ),
];
const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

export function renderWithClient(ui: React.ReactElement) {
    const testQueryClient = createTestQueryClient();
    const { rerender, ...result } = render(
        <QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>,
    );
    return {
        ...result,
        rerender: (rerenderUi: React.ReactElement) => rerender(
                <QueryClientProvider client={testQueryClient}>{rerenderUi}</QueryClientProvider>,
            ),
    };
}

export function createWrapper() {
    const testQueryClient = createTestQueryClient();
    // eslint-disable-next-line react/display-name
    return ({ children }: {children: React.ReactNode}) => (
        <QueryClientProvider client={testQueryClient}>{children}</QueryClientProvider>
    );
}
