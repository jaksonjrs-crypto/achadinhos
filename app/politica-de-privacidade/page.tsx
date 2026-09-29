import type {Metadata} from "next";

export const metadata:Metadata={title:"Política de Privacidade | Vitrine dos Achados",description:"Como a Vitrine dos Achados trata dados durante a navegação e o uso de links de ofertas."};

export default function PrivacyPolicy(){
  return <main className="store" style={{maxWidth:850,margin:"0 auto",padding:"32px 20px",lineHeight:1.7}}>
    <a href="/ofertas">← Voltar para a Vitrine dos Achados</a>
    <h1>Política de Privacidade</h1>
    <p>Última atualização: 29 de setembro de 2026</p>
    <p>A Vitrine dos Achados, sob responsabilidade de Jakson Rodrigues Silva, apresenta ofertas e links de afiliado. Este aviso explica os dados tratados ao visitar o site, acessar uma oferta e conectar uma conta Pinterest ao Garimpo Inteligente.</p>
    <h2>Dados e finalidades</h2>
    <p>Ao acessar um link de oferta, registramos o produto, o canal de origem, a página de referência quando disponível, informações do navegador e a data do clique. Usamos esses dados para contar acessos, entender quais ofertas despertam interesse e manter o serviço funcionando. A hospedagem também pode processar dados técnicos necessários para entregar o site e proteger o acesso.</p>
    <p>Quando o responsável conecta sua conta Pinterest, o aplicativo recebe autorização para consultar as pastas da conta e publicar Pins de ofertas. As credenciais de acesso são guardadas no servidor para executar essa integração. A autorização pode ser revogada nas configurações da conta Pinterest.</p>
    <h2>Links externos e afiliados</h2>
    <p>Ao escolher uma oferta, você pode ser encaminhado ao marketplace responsável pela venda. Esse marketplace trata os dados conforme suas próprias regras. Alguns links são de afiliado e podem gerar comissão para a Vitrine dos Achados, sem custo adicional para você.</p>
    <h2>Compartilhamento e conservação</h2>
    <p>Os dados necessários à hospedagem, ao banco de dados e à integração com Pinterest são processados pelos respectivos fornecedores. Não vendemos os registros de cliques. Conservamos os dados pelo período necessário às finalidades descritas e à segurança do serviço, observadas as obrigações aplicáveis.</p>
    <h2>Seus direitos e contato</h2>
    <p>Você pode solicitar informações, acesso, correção ou exclusão de dados pessoais, quando aplicável. Para questões sobre privacidade, entre em contato pelo canal indicado abaixo.</p>
    <p><strong>Responsável:</strong> Jakson Rodrigues Silva<br/><strong>Contato:</strong> <a href="mailto:Jakson.jrs@gmail.com">Jakson.jrs@gmail.com</a></p>
    <p>Podemos atualizar esta política para refletir mudanças no serviço. A versão vigente estará nesta página.</p>
  </main>;
}
