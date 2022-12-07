import 'regenerator-runtime/runtime';

jest.mock('react-polyglot', () => {
  const originalModule = jest.requireActual('react-polyglot');
  return {
    __esModule: true,
    ...originalModule,
    useTranslate: jest.fn(() => {
      const f = (key) => key;
      f._polyglot = {
        currentLocale: 'en',
      };
      return f;
    }),
  };
});

import React from 'react';

jest.mock('recharts', () => {
  const OriginalModule = jest.requireActual('recharts');

  return {
    ...OriginalModule,
    ResponsiveContainer: ({ height, children }) => (
      <OriginalModule.ResponsiveContainer width={800} height={height}>
        {children}
      </OriginalModule.ResponsiveContainer>
    ),
  };
});
