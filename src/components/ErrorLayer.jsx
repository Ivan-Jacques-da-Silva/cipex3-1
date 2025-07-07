import React from 'react';
import { Link } from 'react-router-dom';

const Erro404 = () => {
    return (
        <div className="card basic-data-table">
            <div className="card-body py-80 px-32 text-center">
                <img src="assets/images/error-img.png" alt="" className="mb-24 bounce" />
                <h6 className="mb-16">Página não encontrada</h6>
                <p className="text-secondary-light">
                    Desculpe, a página que você está procurando não existe.
                </p>
                <Link to="/home" className="btn btn-primary-600 radius-8 px-20 py-11">
                    Voltar para a Home
                </Link>
            </div>
        </div>
    );
};

// CSS inline para o efeito de balanço
const style = document.createElement("style");
style.innerHTML = `
  .bounce {
    animation: bounce 1.5s infinite;
  }
  
  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;
document.head.appendChild(style);

export default Erro404;
