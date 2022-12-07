import 'regenerator-runtime/runtime';

jest.mock('react-polyglot', () => {
  const originalModule = jest.requireActual('react-polyglot');
  return {
    __esModule: true,
    ...originalModule,
    useTranslate: jest.fn(() => {
      return (key) => key;
    }),
  };
});
