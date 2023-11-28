import { render } from 'preact';
import { App } from './app.tsx';
import './index.css';
import { ConfigProvider } from './config/configContext.tsx';

render(
    <ConfigProvider>
        <App />
    </ConfigProvider>,
    document.getElementById('app')!
);
