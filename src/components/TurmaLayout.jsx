import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { API_BASE_URL } from "./config";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Button, Card, Col, Row } from "react-bootstrap";
import axios from "axios";

const Turmas = () => {
    const [turmas, setTurmas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [turmaDataToEdit, setTurmaDataToEdit] = useState(null);
    const [showModalExcluir, setShowModalExcluir] = useState(false);
    const [turmaParaExcluir, setTurmaParaExcluir] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [turmasPerPage, setTurmasPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [loading, setLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [turmaToDelete, setTurmaToDelete] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [turmaData, setTurmaData] = useState(null);
    const [alunosFiltrados, setAlunosFiltrados] = useState([]);
    const [alunosTurma, setAlunosTurma] = useState([]);
    const [loadingAlunos, setLoadingAlunos] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTurmas();
    }, []);

    const userType = parseInt(localStorage.getItem('userType'), 10) || 0;
    const userId = parseInt(localStorage.getItem("userId"), 10) || 0;
    const turmaIdAluno = parseInt(localStorage.getItem("turmaID"), 10) || 0;
    const userName = localStorage.getItem("userName");
    const schoolId = localStorage.getItem("schoolId");
    const podeEditar = !(userType === 4 || userType === 5);


    const fetchTurmas = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/turmas`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            // Garantir que data seja sempre um array
            const turmasArray = Array.isArray(data) ? data : [];

            let turmasFiltradas = turmasArray.filter(turma => turma.cp_tr_id_escola == schoolId);

            if (userType === 4) {
                turmasFiltradas = turmasFiltradas.filter(turma => turma.nomeDoProfessor === userName);
            }
            if (userType === 5) {
                turmasFiltradas = turmasFiltradas.filter(turma => turma.cp_tr_id === turmaIdAluno).slice(0, 1);
                if (turmasFiltradas.length > 0) {
                    const turma = turmasFiltradas[0];
                    try {
                        const responseCurso = await axios.get(`${API_BASE_URL}/cursos/${turma.cp_tr_curso_id}`);
                        turma.cursoNome = responseCurso.data.cp_nome_curso;
                    } catch (error) {
                        console.error("Erro ao buscar curso da turma:", error);
                    }
                }
            }

            setTurmas(turmasFiltradas);
        } catch (error) {
            console.error("Erro ao buscar turmas:", error);
        } finally {
            setLoading(false);
        }
    };



    const handleConfirmarExclusao = async () => {
        if (turmaParaExcluir) {
            try {
                const token = localStorage.getItem('token');
                await fetch(
                    `${API_BASE_URL}/delete-turma/${turmaParaExcluir.cp_tr_id}`,
                    {
                        method: "DELETE",
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                fetchTurmas();
            } catch (error) {
                console.error("Erro ao excluir turma:", error);
            } finally {
                fecharModalExcluir();
            }
        }
    };

    const openDeleteModal = (turma) => {
        setTurmaParaExcluir(turma);
        setShowModalExcluir(true);
    };

    const fecharModalExcluir = () => {
        setShowModalExcluir(false);
        setTurmaParaExcluir(null);
    };

    const handleSortChange = () => {
        const newDirection = sortDirection === "asc" ? "desc" : "asc";
        setSortDirection(newDirection);
        const sortedTurmas = [...turmas].sort((a, b) => {
            const nomeA = a.cp_tr_nome.toLowerCase();
            const nomeB = b.cp_tr_nome.toLowerCase();
            return newDirection === "asc"
                ? nomeA.localeCompare(nomeB)
                : nomeB.localeCompare(nomeA);
        });
        setTurmas(sortedTurmas);
    };

    const filteredTurmas = turmas.filter((turma) => {
        const nome = (turma.cp_tr_nome || "").toLowerCase();
        const professor = (turma.nomedoprofessor || turma.nomeDoProfessor || "").toLowerCase();

        return nome.includes(searchTerm.toLowerCase()) ||
            professor.includes(searchTerm.toLowerCase());
    });

    const totalPaginas = Math.ceil(filteredTurmas.length / turmasPerPage);

    const paginasVisiveis = [];
    for (
        let i = Math.max(1, currentPage - 2);
        i <= Math.min(totalPaginas, currentPage + 2);
        i++
    ) {
        paginasVisiveis.push(i);
    }

    const currentTurmas = filteredTurmas.slice(
        (currentPage - 1) * turmasPerPage,
        currentPage * turmasPerPage
    );

    const openViewModal = async (turmaId) => {
        const turma = turmas.find((turma) => turma.cp_tr_id === turmaId);
        setTurmaData(turma);

        try {
            const responseCurso = await axios.get(`${API_BASE_URL}/cursos/${turma.cp_tr_curso_id}`);
            const curso = responseCurso.data;
            setTurmaData((prevState) => ({
                ...prevState,
                cursoNome: curso.cp_nome_curso,
            }));

            setLoadingAlunos(true);
            const responseAlunos = await axios.get(`${API_BASE_URL}/turmas/${turma.cp_tr_id}/alunos`);
            const alunos = responseAlunos.data;
            setAlunosTurma(alunos);

        } catch (error) {
            console.error("Erro ao buscar curso ou alunos:", error);
        } finally {
            setLoadingAlunos(false);
        }

        setShowViewModal(true);
    };

    const closeViewModal = () => {
        setShowViewModal(false);
        setTurmaData(null);
        setAlunosFiltrados([]);
        setAlunosTurma([]);
    };

    const handleDelete = (turma) => {
        setTurmaToDelete(turma);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                console.error("Token não encontrado");
                navigate('/');
                return;
            }

            await axios.delete(`${API_BASE_URL}/turmas/${turmaToDelete.cp_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            fetchTurmas(); // Recarregar lista
            setShowDeleteModal(false);
            setTurmaToDelete(null);
        } catch (error) {
            console.error('Erro ao excluir turma:', error);
            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                navigate('/');
            }
        }
    };

    return (
        <div className="card h-100 p-0 radius-12">
            {userType === 5 ? (
                <div className="p-4">
                    {turmas.length > 0 ? (
                        <div className="card-body p-24">
                            <Row className="align-items-center">
                                <Col md={3} className="text-center">
                                    <Icon icon="mdi:school-outline" className="text-primary" width={60} height={60} />
                                </Col>
                                <Col>
                                    <h5 className="mb-1 text-secondary">{turmas[0].cp_tr_nome}</h5>
                                    <p className="mb-0"><strong>Início:</strong> {new Date(turmas[0].cp_tr_data).toLocaleDateString("pt-BR")}</p>
                                    <p className="mb-0"><strong>Professor:</strong> {turmas[0].nomedoprofessor || turmas[0].nomeDoProfessor}</p>
                                    <p className="mb-0"><strong>Curso:</strong> {turmas[0].cursoNome || "Carregando..."}</p>
                                </Col>
                            </Row>
                        </div>
                    ) : (
                        <p className="text-center text-muted">Nenhuma turma encontrada.</p>
                    )}
                </div>
            ) : (
                <>
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            <span className="text-md fw-medium text-secondary-light mb-0">
                                Mostrar
                            </span>
                            <select
                                className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                value={turmasPerPage}
                                onChange={(e) => {
                                    setTurmasPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="30">30</option>
                            </select>
                            <form className="navbar-search">
                                <input
                                    type="text"
                                    className="bg-base h-40-px w-auto"
                                    placeholder="Pesquisar"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <Icon icon="ion:search-outline" className="icon" />
                            </form>
                            <button
                                className="btn btn-outline-secondary text-md py-6 radius-12 h-40-px d-flex align-items-center gap-2"
                                onClick={handleSortChange}
                            >
                                Ordenar por {sortDirection === "asc" ? "A-Z" : "Z-A"}
                            </button>
                        </div>
                        {podeEditar && (
                            <Link
                                to={`/cadastro-turma/`}
                                className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                            >
                                <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                                Adicionar Novo
                            </Link>
                        )}
                    </div>
                    <div className="card-body p-24">
                        <div className="table-responsive scroll-sm">
                            <table className="table bordered-table sm-table mb-0">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Data de Início</th>
                                        <th>Professor</th>
                                        <th className="text-center">Ação</th>
                                        {/* {podeEditar && <th className="text-center">Ação</th>} */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="text-center">
                                                Carregando...
                                            </td>
                                        </tr>
                                    ) : (
                                        currentTurmas.map((turma) => (
                                            <tr key={turma.cp_tr_id}>
                                                <td>{turma.cp_tr_nome}</td>
                                                <td>{new Date(turma.cp_tr_data).toLocaleDateString("pt-BR")}</td>
                                                <td>{turma.nomedoprofessor || turma.nomeDoProfessor}</td>
                                                <td className="text-center">
                                                    {podeEditar && (
                                                        <>
                                                            <Link to={`/cadastro-turma/${turma.cp_tr_id}`}
                                                                className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                                            >
                                                                <Icon icon="lucide:edit" />
                                                            </Link>
                                                            <Link
                                                                to="#"
                                                                className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                                                onClick={() => handleDelete(turma)}
                                                            >
                                                                <Icon icon="mingcute:delete-2-line" />
                                                            </Link>
                                                        </>
                                                    )}

                                                    <Link
                                                        to="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            openViewModal(turma.cp_tr_id);
                                                        }}
                                                        className="w-32-px h-32-px me-8 bg-primary-light text-primary-600 rounded-circle d-inline-flex align-items-center justify-content-center"
                                                    >
                                                        <Icon icon="iconamoon:eye-light" />
                                                    </Link>
                                                </td>

                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="d-flex align-items-center justify-content-between mt-24 flex-wrap gap-3">
                            <span>
                                Mostrando {currentPage} de {totalPaginas} páginas
                            </span>
                            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center mb-0">
                                <li className="page-item">
                                    <button
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                    >
                                        <Icon icon="ep:d-arrow-left" />
                                    </button>
                                </li>
                                <li className="page-item">
                                    <button
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Anterior
                                    </button>
                                </li>
                                {paginasVisiveis.map((page) => (
                                    <li
                                        key={page}
                                        className={`page-item ${currentPage === page ? "active" : ""}`}
                                    >
                                        <button
                                            className={`page-link text-md fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px ${currentPage === page
                                                ? "bg-primary-600 text-white"
                                                : "bg-neutral-200 text-secondary-light"
                                                }`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    </li>
                                ))}
                                {totalPaginas > 5 && currentPage + 2 < totalPaginas && (
                                    <li className="page-item">
                                        <span className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px">
                                            ...
                                        </span>
                                    </li>
                                )}
                                <li className="page-item">
                                    <button
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        onClick={() =>
                                            setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))
                                        }
                                        disabled={currentPage === totalPaginas}
                                    >
                                        Próximo
                                    </button>
                                </li>
                                <li className="page-item">
                                    <button
                                        className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                                        onClick={() => setCurrentPage(totalPaginas)}
                                        disabled={currentPage === totalPaginas}
                                    >
                                        <Icon icon="ep:d-arrow-right" />
                                    </button>
                                </li>
                            </ul>
                            <div className="d-flex align-items-center">
                                <select
                                    className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                                    value={currentPage}
                                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                                >
                                    {Array.from({ length: totalPaginas }, (_, idx) => (
                                        <option key={idx + 1} value={idx + 1}>
                                            Página {idx + 1}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                    </div>
                </>
            )}
            <Modal show={showModalExcluir} onHide={fecharModalExcluir} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Exclusão</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Tem certeza que deseja excluir a turma{" "}
                    <strong>{turmaParaExcluir?.cp_tr_nome}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={fecharModalExcluir}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleConfirmarExclusao}>
                        Excluir
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showViewModal} onHide={closeViewModal} size="lg" centered>
                <Modal.Header closeButton>
                    <Modal.Title>Detalhes da Turma</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {turmaData && (
                        <div>
                            <div className="mb-4">
                                <h5 className="mb-3">Informações da Turma</h5>
                                <p><strong>Nome:</strong> {turmaData.cp_tr_nome}</p>
                                <p><strong>Data de Início:</strong> {new Date(turmaData.cp_tr_data).toLocaleDateString("pt-BR")}</p>
                                <p><strong>Professor:</strong> {turmaData.nomedoprofessor || turmaData.nomeDoProfessor || "Não informado"}</p>
                            </div>

                            <div>
                                <h5 className="mb-3">Alunos da Turma ({alunosTurma.length})</h5>
                                {loadingAlunos ? (
                                    <div className="text-center">
                                        <span>Carregando alunos...</span>
                                    </div>
                                ) : alunosTurma.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Nome</th>
                                                    <th>Email</th>
                                                    <th>Telefone</th>
                                                    <th>CPF</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {alunosTurma.map((aluno) => (
                                                    <tr key={aluno.cp_id}>
                                                        <td>{aluno.cp_nome}</td>
                                                        <td>{aluno.cp_email}</td>
                                                        <td>{aluno.cp_telefone || "Não informado"}</td>
                                                        <td>{aluno.cp_cpf || "Não informado"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="text-muted">Nenhum aluno matriculado nesta turma.</p>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={closeViewModal}>
                        Fechar
                    </Button>
                </Modal.Footer>
            </Modal>
             {/* Modal de confirmação de exclusão */}
            {showDeleteModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content radius-16 bg-base">
                            <div className="modal-body p-24 text-center">
                                <span className="mb-16 fs-1 line-height-1 text-danger">
                                    <Icon icon="fluent:delete-24-regular" className="menu-icon" />
                                </span>
                                <h6 className="text-lg fw-semibold text-primary-light mb-8">
                                    Confirmar Exclusão
                                </h6>
                                <p className="text-secondary-light mb-0">
                                    Tem certeza que deseja excluir a turma <strong>{turmaToDelete?.cp_nome_turma}</strong>? Esta ação não pode ser desfeita.
                                </p>
                                <div className="d-flex align-items-center justify-content-center gap-3 mt-24">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary border border-secondary-300 text-secondary-light text-md px-40 py-11 radius-8"
                                        onClick={() => {
                                            setShowDeleteModal(false);
                                            setTurmaToDelete(null);
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-danger text-md px-40 py-11 radius-8"
                                        onClick={confirmDelete}
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModal && <></>}
        </div>
    );
};

export default Turmas;