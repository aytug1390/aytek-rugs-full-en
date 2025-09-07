import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import './index.css';

const rootEl = document.getElementById('root') || (() => {
	const el = document.createElement('div');
	el.id = 'root';
	document.body.appendChild(el);
	return el;
})();

createRoot(rootEl).render(
	<BrowserRouter>
		<Routes>
			<Route path="/*" element={<App />} />
		</Routes>
	</BrowserRouter>
);

