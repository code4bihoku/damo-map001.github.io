import 'semantic-ui-css/semantic.min.css';
//import '../App.css';
//import { List } from 'semantic-ui-react'
/*
const App = () => (
  <List tabIndex={0}>
    <List.Item key="1">Apples</List.Item>
    <List.Item key="2">Pears</List.Item>
    <List.Item key="3">Oranges</List.Item>
  </List>
)
export default App
*/

//import React from 'react';
//import logo from '../logo.svg';
import { List, Container } from 'semantic-ui-react'
import '../App.css';

function App() {
  return (
    <Container fluid>
        <h1>test</h1>
        <List>
          <List.Item key="1">Apples</List.Item>
          <List.Item key="2">Pears</List.Item>
          <List.Item key="3">Oranges</List.Item>
        </List>
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
      </p>
    </Container>
  );
}
export default App;
