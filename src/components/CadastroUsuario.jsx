import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "./config";
import axios from "axios";
// import { ToastContainer } from "react-toastify";
import { Row, Col, Button, Modal } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import InputMask from "react-input-mask";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";




// const CadastroUsuarioModal = ({ closeModal, escolas = [] }) => {
const CadastroUsuarioModal = ({ userId }) => {
    // const { id } = useParams();
    const navigate = useNavigate();

    const [userData, setUserData] = useState({
        cp_nome: "",
        cp_email: "",
        cp_login: "",
        cp_password: "",
        cp_tipo_user: "",
        cp_rg: "",
        cp_cpf: "",
        cp_datanascimento: "",
        cp_estadocivil: "",
        cp_cnpj: "",
        cp_ie: "",
        cp_whatsapp: "",
        cp_telefone: "",
        cp_empresaatuacao: "",
        cp_profissao: "",
        cp_end_cidade_estado: "",
        cp_end_rua: "",
        cp_end_num: "",
        cp_end_cep: "",
        cp_descricao: "",
        cp_escola_id: "",
        cp_foto_perfil: null,
    });
    // const [errorMessage, setErrorMessage] = useState('');
    // const [successMessage, setSuccessMessage] = useState('');
    const [isEmpresa, setIsEmpresa] = useState(false);
    const [userType, setUserType] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [escolas, setEscolas] = useState([]);
    const [showModal, setShowModal] = useState(false);

    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    useEffect(() => {
        const fetchEscolas = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/escolas`);
                setEscolas(response.data);
            } catch (error) {
                console.error("Erro ao buscar escolas:", error);
            }
        };
        fetchEscolas();
    }, []);

    useEffect(() => {
        if (userId) {
            axios.get(`${API_BASE_URL}/users/${userId}`)
                .then(response => {
                    setUserData(response.data); // Preenche o formulário

                })
                .catch(error => {
                    console.error("Erro ao buscar usuário:", error);
                    toast.error("Erro ao carregar os dados do usuário.");
                });
        }
    }, [userId]);


    useEffect(() => {
        const userTypeFromStorage = localStorage.getItem("userType");
        setUserType(parseInt(userTypeFromStorage, 10));
    }, []);

    useEffect(() => {
        if (!userId) {
            const escolaId = localStorage.getItem("schoolId");
            setUserData((prev) => ({ ...prev, cp_escola_id: escolaId }));
        }
    }, []);


    const getFilteredOptions = () => {
        const options = [
            { value: "1", label: "Gestor" },
            { value: "2", label: "Diretor" },
            { value: "3", label: "Secretária" },
            { value: "4", label: "Professor" },
            { value: "5", label: "Aluno" },
        ];

        return options.filter((option) => parseInt(option.value, 10) >= userType);
    };

    // Adicione esta verificação antes de enviar o formulário:
    // if (userData.cp_password !== confirmPassword) {
    //   toast.error("As senhas não coincidem.");
    //   return;
    // }

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "cp_foto_perfil") {
            setUserData((prevUserData) => ({
                ...prevUserData,
                [name]: files[0], // Armazena o arquivo de foto de perfil
            }));
        } else {
            setUserData((prevUserData) => ({
                ...prevUserData,
                [name]: value,
            }));
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (userId) {
                // Modo de edição: Enviar como JSON, pois o backend espera JSON e não FormData
                const response = await axios.put(`${API_BASE_URL}/edit-user/${userId}`, userData, {
                    headers: { "Content-Type": "application/json" }, // Alterado para JSON
                });

                if (response.status === 200) {
                    toast.success("Usuário editado com sucesso!");
                    handleCloseModal();
                    navigate("/usuarios");
                } else {
                    toast.error("Erro ao editar usuário.");
                }
            } else {
                // Modo de cadastro: Criar novo usuário
                const formData = new FormData();
                if (userData.cp_foto_perfil) {
                    formData.append("cp_foto_perfil", userData.cp_foto_perfil);
                }
                Object.keys(userData).forEach((chave) => {
                    if (chave !== "cp_foto_perfil") {
                        formData.append(chave, userData[chave]);
                    }
                });


                const response = await axios.post(`${API_BASE_URL}/register`, formData, {
                    headers: { "Content-Type": "multipart/form-data" }, // Mantém para cadastro
                });

                if (response.data.exists) {
                    toast.error("Usuário já cadastrado");
                    handleCloseModal();
                } else {
                    toast.success("Usuário cadastrado com sucesso!");

                    // Resetar os campos após o cadastro
                    setUserData({
                        cp_nome: "", cp_email: "", cp_login: "", cp_password: "",
                        cp_tipo_user: "", cp_rg: "", cp_cpf: "", cp_datanascimento: "",
                        cp_estadocivil: "", cp_cnpj: "", cp_ie: "", cp_whatsapp: "",
                        cp_telefone: "", cp_empresaatuacao: "", cp_profissao: "",
                        cp_end_cidade_estado: "", cp_end_rua: "", cp_end_num: "",
                        cp_end_cep: "", cp_descricao: "", cp_escola_id: ""
                    });
                }
            }
        } catch (error) {
            console.error("Erro ao salvar:", error.response?.data || error.message);
            toast.error("Erro ao salvar usuário. Tente novamente.");
        }
    };


    return (
        <div>
            <ToastContainer />
            <form className="form-container-cad" onSubmit={handleSubmit}>
                <Row>
                    <Col md={6}>
                        {/* Coluna da Esquerda */}
                        <div className="card mb-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Dados de Login</h6>
                            </div>
                            <div className="card-body">
                                <Row className="gy-3">
                                    <Col md={12}>
                                        <label htmlFor="cp_nome">Nome<span className="required">*</span>:</label>
                                        <input
                                            type="text"
                                            id="cp_nome"
                                            name="cp_nome"
                                            value={userData.cp_nome}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Nome"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_email">E-mail<span className="required">*</span>:</label>
                                        <input
                                            type="email"
                                            id="cp_email"
                                            name="cp_email"
                                            value={userData.cp_email}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="E-mail"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_login">Login<span className="required">*</span>:</label>
                                        <input
                                            type="text"
                                            id="cp_login"
                                            name="cp_login"
                                            value={userData.cp_login}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Login"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_password">Senha<span className="required">*</span>:</label>
                                        <div className="input-group">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                id="cp_password"
                                                name="cp_password"
                                                value={userData.cp_password}
                                                onChange={handleChange}
                                                className="form-control"
                                                placeholder="Senha"
                                                required
                                            />
                                            <Button
                                                variant="secondary"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="input-group-text"
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </Button>
                                        </div>
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_tipo_user">Tipo de Usuário<span className="required">*</span>:</label>
                                        <select
                                            id="cp_tipo_user"
                                            name="cp_tipo_user"
                                            value={userData.cp_tipo_user}
                                            onChange={handleChange}
                                            className="form-control"
                                            required
                                        >
                                            <option value="">Selecione o tipo de usuário</option>
                                            {getFilteredOptions().map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_escola_id">Escola<span className="required">*</span>:</label>
                                        <select
                                            id="cp_escola_id"
                                            name="cp_escola_id"
                                            value={userData.cp_escola_id}
                                            // value={userData.cp_escola_id || localStorage.getItem("schoolId")}
                                            onChange={handleChange}
                                            className="form-control"
                                            required
                                        >
                                            <option value="">Selecione a escola</option>
                                            {escolas.length > 0 ? (
                                                escolas.map((escola) => (
                                                    <option key={escola.cp_ec_id} value={escola.cp_ec_id}>
                                                        {escola.cp_ec_nome}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>Carregando escolas...</option>
                                            )}
                                        </select>
                                    </Col>
                                </Row>
                            </div>
                        </div>

                        <div className="card mt-4 mb-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Dados Pessoais</h6>
                            </div>
                            <div className="card-body">
                                <Row className="gy-3">
                                    <Col md={12}>
                                        <label htmlFor="cp_rg">RG:</label>
                                        <input
                                            type="text"
                                            id="cp_rg"
                                            name="cp_rg"
                                            value={userData.cp_rg}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="RG"
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_cpf">CPF<span className="required">*</span>:</label>
                                        <InputMask
                                            type="text"
                                            id="cp_cpf"
                                            name="cp_cpf"
                                            mask="999.999.999-99"
                                            value={userData.cp_cpf}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="CPF"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_datanascimento">Data de Nascimento<span className="required">*</span>:</label>
                                        <input
                                            type="date"
                                            id="cp_datanascimento"
                                            name="cp_datanascimento"
                                            value={userData.cp_datanascimento}
                                            onChange={handleChange}
                                            className="form-control"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_estadocivil">Estado Civil:</label>
                                        <select
                                            id="cp_estadocivil"
                                            name="cp_estadocivil"
                                            value={userData.cp_estadocivil || ""}
                                            onChange={handleChange}
                                            className="form-control"
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="solteiro">Solteiro(a)</option>
                                            <option value="casado">Casado(a)</option>
                                            <option value="divorciado">Divorciado(a)</option>
                                            <option value="viuvo">Viúvo(a)</option>
                                            <option value="uniao_estavel">União Estável</option>
                                        </select>
                                    </Col>

                                </Row>
                            </div>
                        </div>
                    </Col>

                    <Col md={6}>
                        {/* Coluna da Direita */}
                        <div className="card mb-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Contato</h6>
                            </div>
                            <div className="card-body">
                                <Row className="gy-3">
                                    <Col md={12}>
                                        <label htmlFor="cp_whatsapp">WhatsApp:</label>
                                        <InputMask
                                            type="text"
                                            id="cp_whatsapp"
                                            name="cp_whatsapp"
                                            mask="(99) 99999-9999"
                                            value={userData.cp_whatsapp}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="WhatsApp"
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_telefone">Telefone:</label>
                                        <InputMask
                                            type="text"
                                            id="cp_telefone"
                                            name="cp_telefone"
                                            mask="(99) 99999-9999"
                                            value={userData.cp_telefone}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Telefone"
                                        />
                                    </Col>
                                </Row>
                            </div>
                        </div>

                        <div className="card mt-4 mb-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Endereço</h6>
                            </div>
                            <div className="card-body">
                                <Row className="gy-3">
                                    <Col md={12}>
                                        <label htmlFor="cp_end_cidade_estado">Cidade e Estado:</label>
                                        <input
                                            type="text"
                                            id="cp_end_cidade_estado"
                                            name="cp_end_cidade_estado"
                                            value={userData.cp_end_cidade_estado}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Cidade e Estado"
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_end_rua">Rua:</label>
                                        <input
                                            type="text"
                                            id="cp_end_rua"
                                            name="cp_end_rua"
                                            value={userData.cp_end_rua}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Rua"
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_end_num">Número:</label>
                                        <input
                                            type="text"
                                            id="cp_end_num"
                                            name="cp_end_num"
                                            value={userData.cp_end_num}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Número"
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_end_cep">CEP:</label>
                                        <input
                                            type="text"
                                            id="cp_end_cep"
                                            name="cp_end_cep"
                                            value={userData.cp_end_cep}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="CEP"
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_descricao">Descrição:</label>
                                        <input
                                            type="text"
                                            id="cp_descricao"
                                            name="cp_descricao"
                                            value={userData.cp_descricao}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Descrição"
                                        />
                                    </Col>
                                </Row>
                            </div>
                        </div>

                        <div className="card mt-4 mb-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Empresa</h6>
                            </div>
                            <div className="card-body">
                                <Row className="gy-3">
                                    <Col md={12}>
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={isEmpresa}
                                                onChange={(e) => setIsEmpresa(e.target.checked)}
                                                className="form-check-input"
                                            />
                                            Cadastro de Empresa
                                        </label>
                                    </Col>
                                    {isEmpresa && (
                                        <>
                                            <Col md={12}>
                                                <label htmlFor="cp_cnpj">CNPJ:</label>
                                                <InputMask
                                                    type="text"
                                                    id="cp_cnpj"
                                                    name="cp_cnpj"
                                                    mask="99.999.999/9999-99"
                                                    value={userData.cp_cnpj}
                                                    onChange={handleChange}
                                                    className="form-control"
                                                    placeholder="CNPJ"
                                                />
                                            </Col>
                                            <Col md={12}>
                                                <label htmlFor="cp_ie">IE:</label>
                                                <input
                                                    type="text"
                                                    id="cp_ie"
                                                    name="cp_ie"
                                                    value={userData.cp_ie}
                                                    onChange={handleChange}
                                                    className="form-control"
                                                    placeholder="IE"
                                                />
                                            </Col>
                                            <Col md={12}>
                                                <label htmlFor="cp_empresaatuacao">Empresa de Atuação:</label>
                                                <input
                                                    type="text"
                                                    id="cp_empresaatuacao"
                                                    name="cp_empresaatuacao"
                                                    value={userData.cp_empresaatuacao}
                                                    onChange={handleChange}
                                                    className="form-control"
                                                    placeholder="Empresa de Atuação"
                                                />
                                            </Col>
                                            <Col md={12}>
                                                <label htmlFor="cp_profissao">Profissão:</label>
                                                <input
                                                    type="text"
                                                    id="cp_profissao"
                                                    name="cp_profissao"
                                                    value={userData.cp_profissao}
                                                    onChange={handleChange}
                                                    className="form-control"
                                                    placeholder="Profissão"
                                                />
                                            </Col>
                                        </>
                                    )}
                                </Row>
                            </div>
                        </div>


                    </Col>
                </Row>

                <div className="mt-4 text-center">
                    <button type="button" className="btn btn-primary" onClick={handleShowModal}>
                        {userId ? "Salvar Edição" : "Cadastrar Usuário"}
                    </button>

                </div>
            </form>
            <Modal show={showModal} onHide={handleCloseModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{userId ? "Confirmar Edição" : "Confirmar Cadastro"}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {userId ? "Tem certeza que deseja salvar as alterações deste usuário?" : "Tem certeza que deseja cadastrar este usuário?"}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        {userId ? "Salvar Alterações" : "Cadastrar"}
                    </Button>
                </Modal.Footer>
            </Modal>


        </div>
    );

};

export default CadastroUsuarioModal;
