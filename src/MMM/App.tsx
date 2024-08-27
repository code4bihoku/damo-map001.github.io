import './App.css';
import 'semantic-ui-css/semantic.min.css';
import { Component} from 'react';
import {
    //Segment,
    Table,
} from 'semantic-ui-react'


export default class App extends Component {
    props: any;
    state: any;
    constructor(props: any) {
        super(props);
        this.props = props;
        this.state = {};
    }
    componentDidMount() {};
    
    render(){
        return(
            <div className="App">
                <Table striped tabIndex={0}>
                    <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell>Name</Table.HeaderCell>
                        <Table.HeaderCell>Status</Table.HeaderCell>
                        <Table.HeaderCell>Notes</Table.HeaderCell>
                    </Table.Row>
                    </Table.Header>

                    <Table.Body>
                    <Table.Row verticalAlign='top'>
                        <Table.Cell>John</Table.Cell>
                        <Table.Cell>Approved</Table.Cell>
                        <Table.Cell verticalAlign='top'>
                        Notes
                        <br />
                        1<br />
                        2<br />
                        </Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell>Jamie</Table.Cell>
                        <Table.Cell verticalAlign='bottom'>Approved</Table.Cell>
                        <Table.Cell>
                        Notes
                        <br />
                        1<br />
                        2<br />
                        </Table.Cell>
                    </Table.Row>
                    </Table.Body>
                </Table>
            </div>
        )
    }
}