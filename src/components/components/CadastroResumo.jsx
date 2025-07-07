import React, { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../config";

const CadastroResumo = ({ chamadaId, turmaId, setShowResumoForm, atualizarResumos, dataChamada }) => {
  const [resumos, setResumos] = useState([]);
  const isMobile = window.innerWidth <= 768;
  const [resumoData, setResumoData] = useState({
    resumo: "",
    link: "",
    linkYoutube: "",
    arquivo: null,
    aula: "",
  });

  // Buscar resumos associados a uma chamada
  const fetchResumos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/resumos/${chamadaId}/${turmaId}`);
      setResumos(response.data);
    } catch (error) {
      console.error("Erro ao buscar resumos:", error);
      toast.error("Erro ao buscar resumos. Tente novamente mais tarde.");
    }
  };

  // Salvar novo resumo
  const handleSaveResumo = async () => {
    const formData = new FormData();

    // Capturar a data e hora no formato correto
    // const currentDate = new Date();
    // const formattedDate = currentDate.toISOString().split('T')[0]; // Exemplo: "2024-12-19"
    // const formattedTime = currentDate.toTimeString().split(' ')[0]; // Exemplo: "12:40:00"

    formData.append("turmaId", turmaId);
    formData.append("resumo", resumoData.resumo);
    formData.append("link", resumoData.link);
    formData.append("linkYoutube", resumoData.linkYoutube);
    formData.append("aula", resumoData.aula);
    // formData.append("data", formattedDate); 
    // formData.append("hora", formattedTime); 
    formData.append("data", dataChamada);

    if (resumoData.arquivo) {
      formData.append("arquivo", resumoData.arquivo);
    }

    try {
      await axios.post(`${API_BASE_URL}/resumos`, formData);
      console.log("")
      toast.success("Resumo salvo com sucesso.");
      setResumoData({ resumo: "", link: "", linkYoutube: "", arquivo: null, aula: "" });
      fetchResumos();
      console.log("Etapa 1: Chamando atualizarResumos no cadastro.");
      atualizarResumos(); // Envia o "sinal"
      setShowResumoForm(false); // Fecha o formulário
    } catch (error) {
      console.error("Erro ao salvar resumo:", error);
      toast.error("Erro ao salvar resumo. Tente novamente mais tarde.");
    }
  };


  useEffect(() => {
    if (chamadaId && turmaId) {
      fetchResumos();
    }
  }, [chamadaId, turmaId]);

  return (
    <div
      className={isMobile ? "col-4 p-3" : "col p-3"}
      style={
        isMobile
          ? {
            width: "calc(100% - 30px)",
            position: "fixed",
            top: "50%",
            // margin: "0 10px",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#868f93",
            zIndex: 1050,
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }
          : {}
      }
    >
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Cadastrar Resumo</h5>
        <Button
          variant="light"
          className="btn-close"
          aria-label="Close"
          onClick={() => setShowResumoForm(false)}
          title="Fechar"
        />
      </div>
      <Form>
        <Form.Group>
          <Form.Label>Resumo</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            // onChange={(e) => setResumoData((prev) => ({ ...prev, resumo: e.target.value }))}
            value={resumoData.resumo}
            onChange={(e) => setResumoData({ ...resumoData, resumo: e.target.value })}
          />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Link</Form.Label>
          <Form.Control
            type="text"
            value={resumoData.link}
            onChange={(e) => setResumoData((prev) => ({ ...prev, link: e.target.value }))}
          />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Link do YouTube</Form.Label>
          <Form.Control
            type="text"
            value={resumoData.linkYoutube}
            onChange={(e) => setResumoData((prev) => ({ ...prev, linkYoutube: e.target.value }))}
          />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Arquivo</Form.Label>
          <Form.Control
            type="file"
            onChange={(e) => setResumoData((prev) => ({ ...prev, arquivo: e.target.files[0] }))}
          />
        </Form.Group>
        <Form.Group className="mt-3">
          <Form.Label>Aula</Form.Label>
          <Form.Control
            type="text"
            value={resumoData.aula}
            onChange={(e) => setResumoData((prev) => ({ ...prev, aula: e.target.value }))}
          />
        </Form.Group>
        <Button className="mt-3" onClick={handleSaveResumo}>
          Salvar Resumo
        </Button>
      </Form>
      <hr />
    </div>
  );
};

export default CadastroResumo;
