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
    
    // Se não for edição, define a escola do usuário logado
    if (!turmaID) {
      const schoolId = localStorage.getItem("schoolId");
      if (schoolId) {
        setTurmaData(prev => ({
          ...prev,
          cp_tr_id_escola: schoolId
        }));
      }
    }
  }, [turmaID]);

  // Busca alunos quando escola for selecionada (cadastro) ou quando estiver editando
  useEffect(() => {
    if (turmaData.cp_tr_id_escola) {
      const schoolId = localStorage.getItem("schoolId");
      
      // Verifica se a escola selecionada é a mesma do usuário logado
      if (turmaData.cp_tr_id_escola == schoolId) {
        fetchAlunosPorEscola(turmaData.cp_tr_id_escola);
      }
    }
  }, [turmaData.cp_tr_id_escola]);

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
      
      // Filtrar apenas alunos (cp_tipo_user = 5) da escola específica
      const alunosFiltrados = response.data.filter(usuario => 
        usuario.cp_tipo_user === 5 && usuario.cp_escola_id == escolaId
      );
      
      setAlunosPorEscola(alunosFiltrados);
      setAlunosFiltrados(alunosFiltrados);
    } catch (error) {
      console.error("Erro ao buscar os alunos da escola:", error);
    }
  };

  // Efeito separado para carregar dados da turma quando cursos estiverem carregados
  useEffect(() => {
    const carregarDadosTurma = async () => {
      if (!turmaID || cursos.length === 0) return;
      
      const token = localStorage.getItem('token');
      const schoolId = localStorage.getItem("schoolId");
      
      try {
        console.log("Carregando dados da turma:", turmaID);
        
        const response = await axios.get(`${API_BASE_URL}/turmas/${turmaID}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data) {
          const dadosTurma = response.data;
          console.log("Dados da turma recebidos:", dadosTurma);
          
          // Verifica se a escola da turma é a mesma do usuário logado (para outros tipos além de gestor)
          const userType = parseInt(localStorage.getItem("userType"), 10);
          if (userType !== 1 && dadosTurma.cp_tr_id_escola != schoolId) {
            toast.error("Você não tem permissão para editar esta turma!");
            return;
          }

          // Verifica se o curso existe na lista carregada
          let cursoSelecionado = cursos.find(curso => curso.cp_id_curso === dadosTurma.cp_tr_curso_id);
          
          if (!cursoSelecionado && dadosTurma.cp_tr_curso_id) {
            // Busca o curso específico se não estiver na lista
            try {
              const resCurso = await axios.get(`${API_BASE_URL}/cursos/${dadosTurma.cp_tr_curso_id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (resCurso.data) {
                // Adiciona o curso à lista
                setCursos(prev => {
                  const cursoExistente = prev.find(c => c.cp_id_curso === resCurso.data.cp_id_curso);
                  if (!cursoExistente) {
                    console.log("Adicionando curso específico à lista:", resCurso.data);
                    return [...prev, resCurso.data];
                  }
                  return prev;
                });
                cursoSelecionado = resCurso.data;
              }
            } catch (errorCurso) {
              console.error("Erro ao buscar curso específico:", errorCurso);
            }
          }

          // Preenche os dados básicos da turma
          const turmaDataAtualizada = {
            cp_tr_nome: dadosTurma.cp_tr_nome || "",
            cp_tr_data: dadosTurma.cp_tr_data ? new Date(dadosTurma.cp_tr_data).toISOString().split("T")[0] : "",
            cp_tr_id_professor: String(dadosTurma.cp_tr_id_professor || ""),
            cp_tr_id_escola: String(dadosTurma.cp_tr_id_escola || ""),
            cp_tr_curso_id: String(dadosTurma.cp_tr_curso_id || ""),
            cp_tr_alunos: []
          };

          console.log("Curso selecionado:", cursoSelecionado);
          console.log("Dados da turma atualizados:", turmaDataAtualizada);
          console.log("ID do curso que será selecionado:", dadosTurma.cp_tr_curso_id);

          setTurmaData(turmaDataAtualizada);

          // Busca os alunos da escola e os alunos da turma
          if (dadosTurma.cp_tr_id_escola) {
            try {
              // Busca todos os alunos da escola
              const resAlunos = await axios.get(`${API_BASE_URL}/escola/alunos/${dadosTurma.cp_tr_id_escola}`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              // Filtrar apenas alunos (cp_tipo_user = 5) da escola específica
              const todosAlunosEscola = (resAlunos.data || []).filter(usuario => 
                usuario.cp_tipo_user === 5 && usuario.cp_escola_id == dadosTurma.cp_tr_id_escola
              );
              
              console.log("Alunos da escola carregados:", todosAlunosEscola.length);
              setAlunosPorEscola(todosAlunosEscola);

              // Busca especificamente os alunos desta turma (via cp_turma_id)
              const alunosDaTurma = todosAlunosEscola.filter(aluno => 
                parseInt(aluno.cp_turma_id) === parseInt(turmaID)
              );
              
              console.log("Alunos da turma encontrados:", alunosDaTurma.length);
              
              const alunosIDs = alunosDaTurma.map(aluno => aluno.cp_id);

              // Atualiza os alunos selecionados
              setTurmaData(prev => ({
                ...prev,
                cp_tr_alunos: alunosIDs
              }));

              // Ordenação: alunos da turma primeiro, depois os outros
              const alunosOrdenados = [...todosAlunosEscola].sort((a, b) => {
                const aNaTurma = alunosIDs.includes(a.cp_id) ? -1 : 1;
                const bNaTurma = alunosIDs.includes(b.cp_id) ? -1 : 1;
                return aNaTurma - bNaTurma || a.cp_nome.localeCompare(b.cp_nome);
              });

              setAlunosFiltrados(alunosOrdenados);

            } catch (errorAlunos) {
              console.error("Erro ao buscar alunos:", errorAlunos);
              toast.error("Erro ao carregar alunos da escola!");
            }
          }
        }
      } catch (error) {
        console.error("Erro ao buscar a turma:", error);
        toast.error("Erro ao carregar dados da turma!");
      }
    };

    carregarDadosTurma();
  }, [turmaID, cursos]);



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
    const schoolId = localStorage.getItem("schoolId");
    const userType = parseInt(localStorage.getItem("userType"), 10);

    if (name === "cp_tr_id_escola") {
      // Verifica se o usuário pode alterar a escola
      if (userType !== 1 && value != schoolId) {
        toast.error("Você só pode cadastrar turmas para sua escola!");
        return;
      }
      
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
        response = await axios.put(`${API_BASE_URL}/turmas/${turmaID}`, {
                cp_tr_nome: turmaData.cp_tr_nome,
                cp_tr_data: turmaData.cp_tr_data,
                cp_tr_id_escola: parseInt(turmaData.cp_tr_id_escola),
                cp_tr_id_professor: parseInt(turmaData.cp_tr_id_professor),
                cp_tr_curso_id: parseInt(turmaData.cp_tr_curso_id)
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
        toast.success("Turma atualizada com sucesso!");
      } else {
        // Criar nova turma
         response = await axios.post(`${API_BASE_URL}/turmas`, {
                cp_tr_nome: turmaData.cp_tr_nome,
                cp_tr_data: turmaData.cp_tr_data,
                cp_tr_id_escola: parseInt(turmaData.cp_tr_id_escola),
                cp_tr_id_professor: parseInt(turmaData.cp_tr_id_professor),
                cp_tr_curso_id: parseInt(turmaData.cp_tr_curso_id)
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
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
                      disabled={parseInt(localStorage.getItem("userType"), 10) !== 1}
                    >
                      <option value="" disabled>Selecione uma escola</option>
                      {escolas
                        .filter(escola => {
                          const userType = parseInt(localStorage.getItem("userType"), 10);
                          const schoolId = localStorage.getItem("schoolId");
                          
                          // Se for gestor (userType 1), pode ver todas as escolas
                          if (userType === 1) return true;
                          
                          // Outros usuários só veem sua própria escola
                          return escola.cp_ec_id == schoolId;
                        })
                        .map((escola) => (
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
                        <option key={curso.cp_id_curso} value={String(curso.cp_id_curso)}>
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