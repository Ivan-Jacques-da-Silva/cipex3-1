import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import './childStyle.css';

const menuItems = [
    { texto: "Financeiro", icone: "solar:wallet-bold", classe: "bg-success-main", to: "/financeiro", permissoes: [1, 2, 3] },
    { texto: "Cadastro de Escola", icone: "fa-solid:school", classe: "bg-purple", to: "/cadastro-escola", permissoes: [1] },
    { texto: "Cadastro de Usuário", icone: "fluent:people-20-filled", classe: "bg-info", to: "/cadastro-usuario", permissoes: [1, 2, 3] },
    { texto: "Matrícula", icone: "fa6-solid:chalkboard-user", classe: "bg-yellow", to: "/cadastro-matricula", permissoes: [1, 2, 3] },
    { texto: "Audios", icone: "fa-solid:book", classe: "bg-orange", to: "/audios", permissoes: [1, 2, 4] },
    { texto: "Turmas", icone: "gridicons:multiple-users", classe: "bg-cyan", to: "/turmas", permissoes: [1, 2, 3, 4, 5] },
    { texto: "Sala de Aula", icone: "fa-solid:clipboard-list", classe: "bg-pink", to: localStorage.getItem("userType") === "5" ? "/sala-de-aula-aluno" : "/sala-de-aula", permissoes: [1, 2, 3, 4, 5] },
    { texto: "Certificado", icone: "mdi:certificate", classe: "bg-orange", to: "/certificado", permissoes: [1] },
    { texto: "Avaliações", icone: "fa-solid:clipboard-check", classe: "bg-purple", to: "/avaliacoes", permissoes: [1] },
    { texto: "Treinamento", icone: "fa-solid:file-alt", classe: "bg-yellow", to: "/treinamento", permissoes: [1, 2, 4] },
    { texto: "Material Extra", icone: "mdi:folder-open", classe: "bg-yellow", to: "/material-extra", permissoes: [1, 2, 4] },
];



const MenuHome = () => {
    
    const userType = parseInt(localStorage.getItem('userType'), 10) || 0;
    const userName = localStorage.getItem('userName') || "";

    const navigate = useNavigate(); 

    const renderMenu = () => {
        return menuItems
            .filter((item) => item.permissoes.includes(userType))
            .map((item, index) => (
                <div className="col" key={index}>
                    <div
                        className={`card hover-effect shadow-none border bg-gradient-start-${index + 1} h-100`}
                        onClick={() => navigate(item.to)} 
                        style={{ cursor: 'pointer' }} 
                    >
                        <div className="card-body p-20">
                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                                <div>
                                    <p className="mb-0">{item.texto}</p>
                                </div>
                                <div className={`w-50-px h-50-px ${item.classe} rounded-circle d-flex justify-content-center align-items-center`}>
                                    <Icon icon={item.icone} className="text-white text-2xl mb-0" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ));
    };

    return <div className="row row-cols-xxxl-5 row-cols-lg-3 row-cols-sm-2 row-cols-1 gy-4">{renderMenu()}</div>;
};

export default MenuHome;