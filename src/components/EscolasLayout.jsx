import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "./config";
import { Modal, Button } from "react-bootstrap";

const Escolas = () => {
    const [escolas, setEscolas] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [escolaDataToEdit, setEscolaDataToEdit] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [escolasPerPage, setEscolasPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [loading, setLoading] = useState(false);
    const [mostrarModalExclusao, setMostrarModalExclusao] = useState(false);
    const [idEscolaParaExcluir, setIdEscolaParaExcluir] = useState(null);

    useEffect(() => {
        fetchEscolas();
    }, []);

    const fetchEscolas = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/escolas`);
            const data = await response.json();
            setEscolas(data);
        } catch (error) {
            console.error("Erro ao buscar escolas:", error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModalExclusao = (id) => {
        setIdEscolaParaExcluir(id);
        setMostrarModalExclusao(true);
    };

    // Função para confirmar a exclusão
    const handleConfirmDelete = async () => {
        try {
            await fetch(`${API_BASE_URL}/delete-escola/${idEscolaParaExcluir}`, {
                method: "DELETE",
            });
            setMostrarModalExclusao(false);
            fetchEscolas();
        } catch (error) {
            console.error("Erro ao excluir escola:", error);
        }
    };

    // const handleDelete = async (escolaId) => {
    //     try {
    //         await fetch(`${API_BASE_URL}/delete-escola/${escolaId}`, {
    //             method: "DELETE",
    //         });
    //         fetchEscolas();
    //     } catch (error) {
    //         console.error("Erro ao excluir escola:", error);
    //     }
    // };

    const openEditModal = (escolaId) => {
        const escola = escolas.find((escola) => escola.cp_ec_id === escolaId);
        setEscolaDataToEdit(escola);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        fetchEscolas();
    };

    const handleAddModal = () => {
        setEscolaDataToEdit(null);
        setShowModal(true);
    };

    const handleSortChange = () => {
        const newDirection = sortDirection === "asc" ? "desc" : "asc";
        setSortDirection(newDirection);
        const sortedEscolas = [...escolas].sort((a, b) => {
            const nomeA = a.cp_ec_nome.toLowerCase();
            const nomeB = b.cp_ec_nome.toLowerCase();
            return newDirection === "asc"
                ? nomeA.localeCompare(nomeB)
                : nomeB.localeCompare(nomeA);
        });
        setEscolas(sortedEscolas);
    };

    const filteredEscolas = escolas.filter((escola) =>
        escola.cp_ec_nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPaginas = Math.ceil(filteredEscolas.length / escolasPerPage);

    const paginasVisiveis = [];
    for (
        let i = Math.max(1, currentPage - 2);
        i <= Math.min(totalPaginas, currentPage + 2);
        i++
    ) {
        paginasVisiveis.push(i);
    }

    const currentEscolas = filteredEscolas.slice(
        (currentPage - 1) * escolasPerPage,
        currentPage * escolasPerPage
    );

    return (
        <div className="card h-100 p-0 radius-12">
            <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                <div className="d-flex align-items-center flex-wrap gap-3">
                    <span className="text-md fw-medium text-secondary-light mb-0">
                        Mostrar
                    </span>
                    <select
                        className="form-select form-select-sm w-auto ps-12 py-6 radius-12 h-40-px"
                        value={escolasPerPage}
                        onChange={(e) => {
                            setEscolasPerPage(Number(e.target.value));
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
                <Link
                    to={`/cadastro-escola`}
                    className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
                >
                    <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
                    Adicionar Novo
                </Link>
            </div>
            <div className="card-body p-24">
                <div className="table-responsive scroll-sm">
                    <table className="table bordered-table sm-table mb-0">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Responsável</th>
                                <th>Data de Cadastro</th>
                                <th>Cidade</th>
                                <th className="text-center">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : (
                                currentEscolas.map((escola) => (
                                    <tr key={escola.cp_ec_id}>
                                        <td>{escola.cp_ec_nome}</td>
                                        <td>{escola.cp_ec_responsavel}</td>
                                        <td>
                                            {new Date(escola.cp_ec_data_cadastro).toLocaleDateString(
                                                "pt-BR"
                                            )}
                                        </td>
                                        <td>{escola.cp_ec_endereco_cidade}</td>
                                        <td className="text-center">
                                            <Link
                                                to={`/cadastro-escola/${escola.cp_ec_id}`}
                                                className="w-32-px h-32-px me-8 bg-success-focus text-success-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                            >
                                                <Icon icon="lucide:edit" />
                                            </Link>

                                            <button
                                                onClick={() => abrirModalExclusao(escola.cp_ec_id)}
                                                className="w-32-px h-32-px me-8 bg-danger-focus text-danger-main rounded-circle d-inline-flex align-items-center justify-content-center"
                                            >
                                                <Icon icon="mingcute:delete-2-line" />
                                            </button>

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
            <Modal show={mostrarModalExclusao} onHide={() => setMostrarModalExclusao(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Exclusão</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Tem certeza que deseja excluir esta escola?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setMostrarModalExclusao(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleConfirmDelete}>
                        Confirmar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Escolas;
