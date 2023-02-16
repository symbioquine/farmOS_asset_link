This folder contains "functional tests" for Asset Link. These tests do not make actual network requests, but for the most part test Asset Link as a whole up to the fetch API boundary.

The main exception to that is the loading of the Orbit.js model. That is tested in a dedicated test against a real farmOS instance and would needlessly slow down these tests.