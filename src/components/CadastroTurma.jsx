import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Row, Col, Button, Form, Table, Modal } from "react-bootstrap";
import { FaSearch } from "react-icons/fa";

const CadastroTurmaModal = ({ turmaID }) => {
  console.log("Prop turmaID recebida:", turmaID);
  const [turmaData, setTurmaData] = useState({
    cp_tr_nome: "",
    cp_tr_data: "",
    cp_tr_id_professor: "",
    cp_tr_id_escola: "",
    cp_tr_alunos: [],
    cp_tr_curso_id: "",
  });
  useEffect(() => {
    console.log("turmaID recebido:", turmaID);
  }, [turmaID]);


  const [professores, setProfessores] = useState([]);
  const [escolas, setEscolas] = useState([]);
  const [alunosPorEscola, setAlunosPorEscola] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [alunosFiltrados, setAlunosFiltrados] = useState([]);
  const [mensagem, setMensagem] = useState({ tipo: "", texto: "" });
  const [showModal, setShowModal] = useState(false);


  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);


  useEffect(() => {
    fetchProfessores();
    fetchEscolas();
    fetchCursos();
  }, []);

  // Só busca alunos se não for edição (turmaID inexistente)
  useEffect(() => {
    if (!turmaID && turmaData.cp_tr_id_escola) {
      fetchAlunosPorEscola(turmaData.cp_tr_id_escola);
    }
  }, [turmaData.cp_tr_id_escola, turmaID]);

  // Reordena os alunos sempre que a lista ou os alunos selecionados mudarem
  useEffect(() => {
    if (alunosPorEscola.length) {
      const alunosOrdenados = [...alunosPorEscola].sort((a, b) => {
        const aNaTurma = turmaData.cp_tr_alunos.includes(a.cp_id) ? -1 : 1;
        const bNaTurma = turmaData.cp_tr_alunos.includes(b.cp_id) ? -1 : 1;
        return aNaTurma - bNaTurma || a.cp_nome.localeCompare(b.cp_nome);
      });
      setAlunosFiltrados(alunosOrdenados);
    }
  }, [turmaData.cp_tr_alunos, alunosPorEscola]);


  const fetchAlunosPorEscola = async (escolaId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/escola/alunos/${escolaId}`);
      setAlunosPorEscola(response.data);
      setAlunosFiltrados(response.data);
    } catch (error) {
      console.error("Erro ao buscar os alunos da escola:", error);
    }
  };

  useEffect(() => {
    if (turmaID) {
      axios.get(`${API_BASE_URL}/turmas/${turmaID}`)
        .then(async (response) => {
          if (response.data) {
            setTurmaData({
              ...response.data,
              cp_tr_data: new Date(response.data.cp_tr_data).toISOString().split("T")[0],
            });

            // ✅ Busca os alunos apenas uma vez
            const res = await axios.get(`${API_BASE_URL}/escola/alunos/${response.data.cp_tr_id_escola}`);

            if (res.data.length > 0) {
              const todosAlunos = res.data;
              const alunosDaTurma = todosAlunos.filter(aluno => aluno.cp_turma_id == turmaID);
              const alunosIDs = alunosDaTurma.map(aluno => aluno.cp_id);

              setTurmaData(prev => ({
                ...prev,
                cp_tr_alunos: alunosIDs
              }));

              // ✅ Ordenação correta para manter os alunos da turma no topo
              const alunosOrdenados = [...todosAlunos].sort((a, b) => {
                const aNaTurma = alunosIDs.includes(a.cp_id) ? -1 : 1;
                const bNaTurma = alunosIDs.includes(b.cp_id) ? -1 : 1;
                return aNaTurma - bNaTurma || a.cp_nome.localeCompare(b.cp_nome);
              });

              setAlunosPorEscola(todosAlunos);
              setAlunosFiltrados(alunosOrdenados);
            }
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar a turma:", error);
          toast.error("Erro ao carregar dados da turma!");
        });
    }
  }, [turmaID]);



  const fetchProfessores = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users-professores`);
      setProfessores(response.data);
    } catch (error) {
      console.error("Erro ao buscar os professores:", error);
    }
  };

  const fetchEscolas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/escolas`);
      setEscolas(response.data);
    } catch (error) {
      console.error("Erro ao buscar as escolas:", error);
    }
  };

  const fetchCursos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cursos`);
      setCursos(response.data);
    } catch (error) {
      console.error("Erro ao buscar os cursos:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "cp_tr_id_escola") {
      setTurmaData((prev) => ({ ...prev, [name]: value, cp_tr_alunos: [] }));
    } else {
      setTurmaData((prev) => ({ ...prev, [name]: value }));
    }
  };


  const normalizeString = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const handleSearchChange = (e) => {
    const searchValue = normalizeString(e.target.value);
    setSearchTerm(e.target.value);

    const alunosFiltrados = alunosPorEscola.filter(aluno =>
      normalizeString(aluno.cp_nome).includes(searchValue)
    );

    setAlunosFiltrados(alunosFiltrados);
  };


  const handleCheckboxChange = (e, alunoId) => {
    const isChecked = e.target.checked;
    setTurmaData((prevData) => {
      const updatedAlunos = isChecked
        ? [...prevData.cp_tr_alunos, alunoId]
        : prevData.cp_tr_alunos.filter((id) => id !== alunoId);

      return { ...prevData, cp_tr_alunos: updatedAlunos };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const dataToSend = {
        cp_tr_nome: turmaData.cp_tr_nome,
        cp_tr_data: turmaData.cp_tr_data,
        cp_tr_id_professor: turmaData.cp_tr_id_professor,
        cp_tr_id_escola: turmaData.cp_tr_id_escola,
        cp_tr_curso_id: turmaData.cp_tr_curso_id,
        cp_tr_alunos: turmaData.cp_tr_alunos
      };

      let response;

      if (turmaID) {
        // Atualizar turma existente
        response = await axios.put(`${API_BASE_URL}/update-turma/${turmaID}`, dataToSend);
        toast.success("Turma atualizada com sucesso!");
      } else {
        // Criar nova turma
        response = await axios.post(`${API_BASE_URL}/register-turma`, dataToSend);
        toast.success("Turma cadastrada com sucesso!");
        // Limpar campos após cadastrar
        setTurmaData({
          cp_tr_nome: "",
          cp_tr_data: "",
          cp_tr_id_professor: "",
          cp_tr_id_escola: "",
          cp_tr_curso_id: "",
          cp_tr_alunos: []
        });
      }

      if (response.status === 200) {
        setShowModal(false); // Fecha o modal
      }
    } catch (error) {
      console.error("Erro ao salvar a turma:", error);
      toast.error("Erro ao salvar a turma");
    }
  };


  return (
    <div>
      <ToastContainer />
      <form className="form-container-cad" onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="card-title mb-0">Informações da Turma</h6>
              </div>
              <div className="card-body">
                <Row className="gy-3">
                  <Col md={12}>
                    <label htmlFor="cp_tr_nome">Nome<span className="required">*</span>:</label>
                    <input
                      type="text"
                      id="cp_tr_nome"
                      name="cp_tr_nome"
                      value={turmaData.cp_tr_nome}
                      onChange={handleChange}
                      className="form-control"
                      placeholder="Nome da turma"
                      required
                    />
                  </Col>
                  <Col md={12}>
                    <label htmlFor="cp_tr_data">Data<span className="required">*</span>:</label>
                    <input
                      type="date"
                      id="cp_tr_data"
                      name="cp_tr_data"
                      value={turmaData.cp_tr_data}
                      onChange={handleChange}
                      className="form-control"
                      required
                    />
                  </Col>
                  <Col md={12}>
                    <label htmlFor="cp_tr_id_professor">Professor<span className="required">*</span>:</label>
                    <select
                      id="cp_tr_id_professor"
                      name="cp_tr_id_professor"
                      value={turmaData.cp_tr_id_professor}
                      onChange={handleChange}
                      className="form-control"
                      required
                    >
                      <option value="">Selecione o professor</option>
                      {professores.map((professor) => (
                        <option key={professor.cp_id} value={professor.cp_id}>
                          {professor.cp_nome}
                        </option>
                      ))}
                    </select>
                  </Col>
                </Row>
              </div>
            </div>

            <div className="card mb-3">
              <div className="card-header">
                <h6 className="card-title mb-0">Detalhes Adicionais</h6>
              </div>
              <div className="card-body">
                <Row className="gy-3">
                  <Col md={12}>
                    <label htmlFor="cp_tr_id_escola">Escola<span className="required">*</span>:</label>
                    <select
                      id="cp_tr_id_escola"
                      name="cp_tr_id_escola"
                      value={turmaData.cp_tr_id_escola}
                      onChange={handleChange}
                      className="form-control"
                      required
                    >
                      <option value="" disabled>Selecione uma escola</option>
                      {escolas.map((escola) => (
                        <option key={escola.cp_ec_id} value={escola.cp_ec_id}>
                          {escola.cp_ec_nome}
                        </option>
                      ))}
                    </select>
                  </Col>

                  <Col md={12}>
                    <label htmlFor="cp_tr_curso_id">Curso<span className="required">*</span>:</label>
                    <select
                      id="cp_tr_curso_id"
                      name="cp_tr_curso_id"
                      value={turmaData.cp_tr_curso_id}
                      onChange={handleChange}
                      className="form-control"
                      required
                    >
                      <option value="">Selecione o curso</option>
                      {cursos.map((curso) => (
                        <option key={curso.cp_curso_id} value={curso.cp_curso_id}>
                          {curso.cp_nome_curso}
                        </option>
                      ))}
                    </select>
                  </Col>
                </Row>
              </div>
            </div>
          </Col>

          <Col md={6}>
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="card-title mb-0">Alunos</h6>
              </div>
              <div className="card-body">
                <Row className="gy-3">
                  <Col md={12}>
                    <label htmlFor="search">Buscar Aluno:</label>
                    <div className="input-group">
                      <input
                        type="text"
                        id="search"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="form-control"
                        placeholder="Digite o nome do aluno"
                      />
                      <Button variant="outline-secondary">
                        <FaSearch />
                      </Button>
                    </div>
                  </Col>

                  <Col md={12}>
                    <div className="table-container">
                      {alunosFiltrados.length > 0 ? (
                        <div className="table-responsive overflow-auto" style={{ maxHeight: "300px" }}>
                          <Table striped bordered hover className="overflow-auto">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Nome</th>
                              </tr>
                            </thead>
                            <tbody>
                              {alunosFiltrados.map((aluno) => (
                                <tr key={aluno.cp_id}>
                                  <td>
                                    <Form.Check
                                      type="checkbox"
                                      checked={Array.isArray(turmaData.cp_tr_alunos) && turmaData.cp_tr_alunos.includes(aluno.cp_id)}
                                      onChange={(e) => handleCheckboxChange(e, aluno.cp_id)}
                                    />

                                  </td>
                                  <td>{aluno.cp_nome}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      ) : (
                        <p className="text-muted">Nenhum aluno encontrado. Selecione uma escola!</p>
                      )}

                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>

        <div className="mt-4 text-center">
          <Button variant="primary" onClick={handleShowModal}>
            {turmaID ? "Salvar Alterações" : "Cadastrar Turma"}
          </Button>
        </div>
      </form>
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Cadastro</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Tem certeza que deseja {turmaID ? "salvar as alterações" : "cadastrar esta turma"}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default CadastroTurmaModal;
