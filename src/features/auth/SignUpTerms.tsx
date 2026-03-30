import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Language } from '@/store/atoms';
import { Button, Card } from '@/components/ui/Base';
import { useLang, useT } from '@/i18n';
import {
  REQUIRED_SIGNUP_TERM_IDS,
  clearSignupTermsAgreement,
  saveSignupTermsAgreement,
  type RequiredSignupTermId,
} from './signupVerificationStorage';

type TermContent = {
  id: RequiredSignupTermId;
  title: string;
  items: string[];
};

const TERMS_COPY: Record<Language, {
  title: string;
  description: string;
  allAgree: string;
  continue: string;
  requiredError: string;
  sections: TermContent[];
}> = {
  ko: {
    title: '회원가입',
    description: '회원정보 입력 전 아래 내용을 확인하고 필수 약관에 동의해주세요.',
    allAgree: '전체 동의함(선택항목 포함)',
    continue: '회원가입',
    requiredError: '필수 약관에 모두 동의해주세요.',
    sections: [
      {
        id: 'terms',
        title: '이용약관 동의 (필수)',
        items: [
          '제1조(목적)\n① 본 약관은 회사가 제공하는 커뮤니티, 게시판, 파일 업로드, 회원관리 및 이에 부수하는 제반 서비스의 이용과 관련하여 회사와 이용자 사이의 권리, 의무, 책임사항 및 운영기준을 정함을 목적으로 합니다.\n② 본 약관은 회원가입 단계에서 이용자가 명시적으로 동의함으로써 효력이 발생하며, 서비스 내 개별 정책, 운영기준, 공지사항은 본 약관을 보충하는 해석기준으로 적용될 수 있습니다.',
          '제2조(서비스 제공 및 장애)\n① 회사는 서비스의 전부 또는 일부를 연중무휴 제공하기 위하여 노력하되, 시스템 점검, 서버 증설, 데이터베이스 정비, 네트워크 장애, 외부 연동 서비스 장애, 불가항력적 사유 또는 기술상 필요가 있는 경우 서비스 제공을 일시적으로 중단하거나 제한할 수 있습니다.\n② 회사는 전항의 사유가 발생한 경우 가능한 범위에서 사전 공지 또는 사후 안내를 할 수 있으며, 긴급 보안조치 또는 예측 불가능한 장애 상황에서는 사전 통지가 제한될 수 있습니다.',
          '제3조(면책)\n① 회사는 천재지변, 전쟁, 테러, 국가비상사태, 기간통신사업자의 서비스 중단, 이용자 기기 이상, 이용자 계정 관리 소홀 기타 회사의 합리적 통제 범위를 벗어난 사유로 발생한 손해에 대하여 책임을 지지 않습니다.\n② 회사는 이용자가 서비스에 게시, 저장, 전송 또는 업로드한 정보의 정확성, 완전성, 적법성, 최신성 및 특정 목적 적합성을 보증하지 않으며, 회사의 고의 또는 중대한 과실이 없는 한 해당 정보로 인한 분쟁이나 손해에 대하여 책임을 부담하지 않습니다.',
          '제4조(UGC의 게시 및 관리)\n① 이용자가 작성한 게시물, 댓글, 사진, 영상, 코드, 문서, 첨부파일 기타 일체의 UGC는 이용자 본인의 책임 아래 게시되어야 하며, 이용자는 해당 콘텐츠가 제3자의 저작권, 초상권, 상표권, 영업비밀 기타 권리를 침해하지 않음을 보장하여야 합니다.\n② 회사는 UGC가 관계 법령, 본 약관, 운영정책 또는 공서양속에 위반되거나 분쟁 발생의 우려가 있다고 합리적으로 판단하는 경우 사전 통지 없이 임시조치, 비공개 전환, 수정 요청, 삭제 또는 접근 제한 조치를 할 수 있습니다.',
          '제5조(업로드 파일의 보관 및 손실 가능성)\n① 이용자는 서비스에 업로드한 사진, 문서, 코드 및 기타 파일에 대하여 별도의 원본 보관 의무를 부담하며, 회사는 백업 정책, 저장 장치 장애, 전송 오류, 동기화 지연, 보관기간 만료, 복구 작업 등으로 인하여 파일이 일부 또는 전부 소실되거나 훼손되지 아니함을 보장하지 않습니다.\n② 회사는 안정적 서비스 제공을 위하여 합리적인 범위에서 백업 및 복구 절차를 운영할 수 있으나, 그러한 조치가 특정 이용자의 개별 파일 보존을 절대적으로 보장하는 것은 아닙니다.',
          '제6조(이용 제한 및 약관 개정)\n① 회사는 서비스 안정성 확보, 법령 준수, 부정 이용 방지, 권리침해 신고 대응, 보안상 위험 제거 또는 운영정책 집행을 위하여 특정 이용자 또는 특정 기능에 대한 이용을 제한하거나 계정을 정지 또는 종료할 수 있습니다.\n② 회사는 약관을 개정할 수 있으며, 개정 시 시행일 및 주요 내용을 서비스 화면, 공지사항 또는 회원이 확인 가능한 방식으로 안내합니다.\n③ 이용자가 개정 약관 시행일 이후에도 서비스를 계속 이용하는 경우 개정 내용에 동의한 것으로 볼 수 있습니다.',
          '제7조(보칙)\n① 본 약관은 현재 제공 중인 서비스 구조, 기능 범위 및 운영정책을 기준으로 우선 적용되는 이용조건을 정리한 것입니다.\n② 회사는 향후 서비스의 정식 운영 단계 진입, 기능 확장, 정책 정비 또는 관련 법령 변경에 따라 본 약관의 체계와 문구를 추가로 보완하거나 별도의 정식 규정으로 대체할 수 있습니다.',
        ],
      },
      {
        id: 'privacy',
        title: '개인정보 수집, 이용에 대한 동의 (필수)',
        items: [
          '제1조(수집 원칙)\n① 회사는 회원가입, 본인 확인, 서비스 제공, 부정 이용 방지 및 고객 응대를 위하여 필요한 최소한의 개인정보를 수집합니다.\n② 회사는 수집 목적의 범위를 넘어 개인정보를 이용하지 아니하며, 목적이 변경되는 경우에는 관련 법령이 허용하는 범위 내에서 별도 동의 또는 적법한 조치를 거칩니다.',
          '제2조(수집 항목)\n① 회원가입 시 회사는 이메일 주소, 닉네임, 비밀번호, 이메일 인증 여부 및 인증 처리 기록을 수집할 수 있습니다.\n② 서비스 이용 과정에서 접속 IP 주소, 브라우저 종류, 운영체제, 기기 식별 정보, 로그인 일시, 이용 기록, 쿠키, 세션 정보, 오류 로그, 서비스 접속 환경 정보가 자동으로 생성되어 수집될 수 있습니다.\n③ 이용자가 문의, 신고 또는 분쟁조정 절차를 진행하는 경우 회사는 회신 및 사실 확인을 위하여 추가 제출 자료를 수집할 수 있습니다.',
          '제3조(이용 목적)\n① 수집한 개인정보는 회원 식별, 계정 생성, 로그인 처리, 인증 코드 발송, 본인 확인, 맞춤형 서비스 제공, 공지사항 전달, 보안 점검, 이상행위 탐지, 장애 대응, 문의 처리 및 분쟁 해결을 위하여 이용됩니다.\n② 회사는 서비스 운영상 필요한 통계 작성, 접속 빈도 파악, 서비스 개선, 보안 정책 수립을 위하여 개인정보 또는 개인정보와 연계될 수 있는 이용기록을 분석할 수 있습니다.',
          '제4조(보관 및 파기)\n① 개인정보는 원칙적으로 수집 및 이용 목적이 달성된 때 지체 없이 파기합니다.\n② 다만, 관계 법령에 따라 일정 기간 보관이 요구되거나 수사, 분쟁, 민원 대응, 권리보호 필요성이 인정되는 경우 해당 기간 동안 별도 분리하여 안전하게 보관할 수 있습니다.\n③ 전자적 파일 형태의 개인정보는 복구가 불가능한 방법으로 삭제하며, 출력물 또는 기록물은 파쇄 또는 이에 준하는 방법으로 파기합니다.',
          '제5조(이용자의 권리)\n① 이용자는 자신의 개인정보에 대하여 열람, 정정, 삭제, 처리정지, 동의 철회 및 회원탈퇴를 요청할 수 있습니다.\n② 회사는 관련 법령에서 허용하거나 제한하는 범위를 제외하고는 이용자의 요청을 지체 없이 검토 및 처리하며, 정당한 사유로 제한되는 경우 그 사유를 안내할 수 있습니다.',
          '제6조(관련 법령 및 보호조치)\n① 회사는 「개인정보 보호법」에 따라 개인정보 처리의 적법성, 안전성, 투명성을 확보하기 위하여 필요한 관리적, 기술적, 물리적 보호조치를 이행하기 위하여 노력합니다.\n② 회사는 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「전자상거래 등에서의 소비자보호에 관한 법률」 기타 개인정보 및 전자거래 관련 법령을 준수하며, 관련 법령의 개정 또는 감독기관의 가이드라인 변경 시 그에 맞추어 개인정보 처리기준을 조정할 수 있습니다.',
        ],
      },
    ],
  },
  en: {
    title: 'Sign Up',
    description: 'Please review the information below and agree to the required terms before entering your account details.',
    allAgree: 'Agree to all (including optional items)',
    continue: 'Sign Up',
    requiredError: 'Please agree to all required terms.',
    sections: [
      {
        id: 'terms',
        title: 'Agreement to Terms of Use (Required)',
        items: [
          'Article 1 (Purpose)\n1. These terms define the rights, obligations, liabilities, and operational standards between the company and users in relation to the community, board, file upload, membership, and related services provided by the company.\n2. These terms take effect once the user expressly agrees during the sign-up process, and separate policies or notices may supplement these terms.',
          'Article 2 (Service Availability)\n1. The company endeavors to provide the service continuously, but the service may be suspended or limited due to maintenance, server work, network failures, third-party outages, or technical necessity.\n2. Where reasonably possible, the company may provide prior or subsequent notice, but advance notice may be limited in emergency security or outage situations.',
          'Article 3 (Disclaimer)\n1. The company is not liable for damages caused by force majeure, telecommunications failures, device issues, or reasons attributable to the user, except in cases of intent or gross negligence.\n2. The company does not warrant the accuracy, legality, completeness, or fitness for a particular purpose of user-generated content.',
          'Article 4 (UGC and Uploaded Files)\n1. Users are solely responsible for posts, comments, photos, code, documents, attachments, and other UGC they upload.\n2. Content that infringes third-party rights or violates laws or policies may be hidden, restricted, modified upon request, or removed without prior notice.\n3. Uploaded files may be lost, damaged, delayed, or deleted due to transmission errors, storage failures, retention expiration, or recovery operations, and users must keep their own originals.',
          'Article 5 (Restrictions and Amendments)\n1. The company may restrict service use, suspend accounts, or terminate access in order to protect service stability, comply with law, prevent abuse, or respond to rights infringement.\n2. If these terms are amended, the effective date and major changes will be announced through the service or notices, and continued use after the effective date may be deemed acceptance.',
          'Article 6 (Supplementary Provision)\n1. These terms summarize the usage conditions that are primarily applied based on the service structure, feature scope, and operational policies currently in place.\n2. The company may later refine, supplement, or replace these terms with more formal terms as the service becomes more fully established or expands.',
        ],
      },
      {
        id: 'privacy',
        title: 'Agreement to Collection and Use of Personal Information (Required)',
        items: [
          'Article 1 (Collection Principle)\n1. The company collects the minimum personal information necessary for sign-up, identity verification, service operation, abuse prevention, and customer support.\n2. Personal information will not be used beyond the disclosed purposes unless permitted by law or supported by additional lawful procedures.',
          'Article 2 (Collected Items)\n1. At sign-up, the company may collect the user’s email address, nickname, password, authentication status, and authentication processing records.\n2. During service use, IP address, browser type, operating system, device information, login timestamps, usage records, cookies, session information, and error logs may be collected automatically.\n3. Additional materials may be collected if needed to respond to complaints, reports, or disputes.',
          'Article 3 (Purpose of Use)\n1. Personal information is used for member identification, account creation, login processing, delivery of authentication codes, notices, service provision, security monitoring, abuse detection, incident response, inquiry handling, and dispute resolution.\n2. The company may also analyze service usage information for statistics, service improvement, and security policy design.',
          'Article 4 (Retention and Destruction)\n1. Personal information is destroyed without delay once the purpose of collection and use has been fulfilled.\n2. However, if retention is required by applicable law or reasonably necessary for dispute handling or rights protection, the information may be stored separately for the relevant period.\n3. Electronic files are deleted using irreversible methods, and printed materials are shredded or destroyed by equivalent means.',
          'Article 5 (User Rights)\n1. Users may request access, correction, deletion, suspension of processing, withdrawal of consent, or account deletion regarding their personal information.\n2. The company will review and handle such requests without delay unless restricted by applicable law.',
          'Article 6 (Applicable Laws and Protection)\n1. The company endeavors to implement administrative, technical, and physical safeguards in accordance with the Personal Information Protection Act.\n2. The company complies with applicable laws, including the Personal Information Protection Act, the Act on Promotion of Information and Communications Network Utilization and Information Protection, and the Act on Consumer Protection in Electronic Commerce, and may update its privacy handling standards when those laws or official guidelines change.',
        ],
      },
    ],
  },
};

function createAgreementState() {
  return REQUIRED_SIGNUP_TERM_IDS.reduce((acc, id) => {
    acc[id] = false;
    return acc;
  }, {} as Record<RequiredSignupTermId, boolean>);
}

export const SignUpTerms = () => {
  const navigate = useNavigate();
  const t = useT();
  const lang = useLang();
  const copy = TERMS_COPY[lang];
  const [agreements, setAgreements] = useState<Record<RequiredSignupTermId, boolean>>(() => createAgreementState());
  const [error, setError] = useState('');

  useEffect(() => {
    clearSignupTermsAgreement();
    setAgreements(createAgreementState());
  }, []);

  const allChecked = useMemo(
    () => REQUIRED_SIGNUP_TERM_IDS.every((id) => agreements[id]),
    [agreements],
  );

  const handleToggle = (id: RequiredSignupTermId, checked: boolean) => {
    setAgreements((prev) => ({ ...prev, [id]: checked }));
    setError('');
  };

  const handleToggleAll = (checked: boolean) => {
    setAgreements(
      REQUIRED_SIGNUP_TERM_IDS.reduce((acc, id) => {
        acc[id] = checked;
        return acc;
      }, {} as Record<RequiredSignupTermId, boolean>),
    );
    setError('');
  };

  const handleContinue = () => {
    if (!allChecked) {
      setError(copy.requiredError);
      return;
    }

    saveSignupTermsAgreement(agreements);
    navigate('/signup', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4">
      <Card className="w-full max-w-2xl bg-surface border-border-default">
        <div className="border-b border-border-default px-6 py-5">
          <h1 className="text-2xl font-bold text-text-primary">{copy.title}</h1>
          <p className="mt-2 text-sm text-text-muted">{copy.description}</p>
        </div>

        <div className="px-6 py-4">
          {copy.sections.map((section) => {
            return (
              <div key={section.id} className="border-b border-border-default py-4 last:border-b-0">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreements[section.id]}
                    onChange={(e) => handleToggle(section.id, e.target.checked)}
                    aria-label={section.title}
                    className="h-4 w-4 shrink-0 rounded border-border-default bg-input-bg text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-text-primary">{section.title}</span>
                </div>

                <div className="mt-3 ml-7 rounded-xl border border-border-default bg-input-bg/50 p-4">
                  <div className="max-h-40 overflow-y-auto pr-2">
                    <div className="space-y-3 text-sm leading-6 text-text-secondary">
                      {section.items.map((item) => (
                        <div key={item} className="whitespace-pre-line rounded-lg border border-border-default/60 bg-surface-subtle/30 p-3">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <hr className="my-5 border-border-default" />

          <label className="flex cursor-pointer items-center gap-3 py-1">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => handleToggleAll(e.target.checked)}
              className="h-4 w-4 rounded border-border-default bg-input-bg text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-text-primary">{copy.allAgree}</span>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            type="button"
            onClick={handleContinue}
            disabled={!allChecked}
            className="mt-6 w-full bg-emerald-600 py-2.5 hover:bg-emerald-700"
          >
            {copy.continue}
          </Button>

          <p className="text-center text-sm text-text-muted">
            {t('auth.hasAccount')}{' '}
            <button onClick={() => navigate('/login')} className="font-medium text-emerald-500 hover:text-emerald-400">
              {t('auth.login')}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};
