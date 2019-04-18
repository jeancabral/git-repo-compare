import React, { Component } from 'react';
import moment from 'moment';
import api from '../../services/api';

import logo from '../../assets/logo.png';

import { Container, Form } from './styles';
import CompareList from '../../components/CompareList';

export default class Main extends Component {
  state = {
    isLoading: false,
    repositoryInput: '',
    repositories: [],
    repositoryError: false,
  };

  async componentDidMount() {
    this.setState({ isLoading: true });

    this.setState({ isLoading: false, repositories: await this.getLocalRepositories() });
  }

  getLocalRepositories = async () => JSON.parse(await localStorage.getItem('repositories')) || [];

  handleRemoveRepository = async (id) => {
    const { repositories } = this.state;

    const updatedRepositories = repositories.filter(repository => repository.id !== id);

    this.setState({ repositories: updatedRepositories });

    await localStorage.setItem('repositories', JSON.stringify(updatedRepositories));
  };

  handleUpdateRepository = async (id) => {
    const { repositories } = this.state;

    const repository = repositories.find(repo => repo.id === id);

    try {
      const { data } = await api.get(`/repos/${repository.full_name}`);

      data.last_commit = moment(data.pushed_at).fromNow();

      this.setState({
        repositoryError: false,
        repositoryInput: '',
        repositories: repositories.map(repo => (repo.id === data.id ? data : repo)),
      });

      await localStorage.setItem('repositories', JSON.stringify(repositories));
    } catch (err) {
      this.setState({ repositoryError: true });
    }
  };

  handleAddRespository = async (e) => {
    e.preventDefault();

    this.setState({ isLoading: true });

    try {
      const { data: repository } = await api.get(`/repos/${this.state.repositoryInput}`);
      repository.last_commit = moment(repository.pushed_at).fromNow();

      const localRepositories = await this.getLocalRepositories();

      await localStorage.setItem(
        'repositories',
        JSON.stringify([...localRepositories, repository]),
      );

      this.setState({
        repositoryError: false,
        repositoryInput: '',
        repositories: [...this.state.repositories, repository],
        isLoading: false,
      });
    } catch (error) {
      this.setState({ repositoryError: true });
    } finally {
      this.setState({ isLoading: false });
    }
  };

  render() {
    const {
      repositories, repositoryInput, repositoryError, isLoading,
    } = this.state;

    return (
      <Container>
        <img src={logo} alt="Logo" />
        <Form withError={repositoryError} onSubmit={this.handleAddRespository}>
          <input
            type="text"
            placeholder="usuário/repositório"
            value={repositoryInput}
            onChange={e => this.setState({ repositoryInput: e.target.value })}
          />
          <button type="submit">
            {isLoading ? <i className="fa fa-spinner fa-pulse" /> : 'Ok'}
          </button>
        </Form>

        <CompareList
          repositories={repositories}
          removeRepository={this.handleRemoveRepository}
          updateRepository={this.handleUpdateRepository}
        />
      </Container>
    );
  }
}
