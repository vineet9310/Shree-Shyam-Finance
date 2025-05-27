// src/components/custom/ApplicationDetails.tsx

"use client";
import type { LoanApplication, CollateralDocument } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, UserCircle, CalendarDays, IndianRupee, Briefcase, ShieldQuestion, Info, Paperclip, Users as UsersIcon, Volume2, Image as ImageIcon, XCircle } from "lucide-react"; // Added XCircle for rejected icon
import FormattedDate from "@/components/custom/FormattedDate";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react"; // Import useRef for audio playback

interface ApplicationDetailsProps {
  application: LoanApplication;
}

// Helper to format document names for display, now expects URL instead of name
const formatDocumentForDisplay = (label: string, url?: string) => {
  if (url) {
    // Attempt to extract a friendly name from URL or use a generic one
    const fileNameMatch = url.match(/\/([^\/?#]+)[\?#]?$/);
    const fileName = fileNameMatch ? decodeURIComponent(fileNameMatch[1]) : 'Document';
    const displayedName = fileName.length > 30 ? fileName.substring(0, 27) + '...' : fileName;
    return { label: label, url: url, displayName: displayedName };
  }
  return null;
};


export function ApplicationDetails({ application }: ApplicationDetailsProps) {
  const { toast } = useToast();
  const rejectionAudioRef = useRef<HTMLAudioElement | null>(null);

  const allDocumentsForDisplay: { label: string; url: string; displayName: string }[] = [];

  // Borrower documents (now checking for URLs)
  if (application.borrowerIdProofDocumentUrl) {
    allDocumentsForDisplay.push(formatDocumentForDisplay("Borrower ID Proof", application.borrowerIdProofDocumentUrl)!);
  }
  if (application.borrowerAddressProofDocumentUrl) {
    allDocumentsForDisplay.push(formatDocumentForDisplay("Borrower Address Proof", application.borrowerAddressProofDocumentUrl)!);
  }

  // Guarantor documents (now checking for URLs)
  if (application.guarantor) {
    if (application.guarantor.idProofDocumentUrl) {
      allDocumentsForDisplay.push(formatDocumentForDisplay("Guarantor ID Proof", application.guarantor.idProofDocumentUrl)!);
    }
    if (application.guarantor.addressProofDocumentUrl) {
      allDocumentsForDisplay.push(formatDocumentForDisplay("Guarantor Address Proof", application.guarantor.addressProofDocumentUrl)!);
    }
  }

  // Collateral documents (now checking for URLs)
  if (application.submittedCollateral && application.submittedCollateral.length > 0) {
    application.submittedCollateral.forEach((collateral, index) => {
      const basePrefix = `Collateral ${index + 1} (${collateral.type.replace(/_/g, ' ')})`;
      const collateralDocs: (ReturnType<typeof formatDocumentForDisplay>)[] = [
        formatDocumentForDisplay(`${basePrefix} - ATM Front`, collateral.atmCardFrontImageUrl),
        formatDocumentForDisplay(`${basePrefix} - ATM Back`, collateral.atmCardBackImageUrl),
        formatDocumentForDisplay(`${basePrefix} - Cheque Image`, collateral.chequeImageUrl),
        formatDocumentForDisplay(`${basePrefix} - Bank Statement`, collateral.bankStatementUrl),
        formatDocumentForDisplay(`${basePrefix} - Vehicle RC`, collateral.vehicleRcImageUrl),
        formatDocumentForDisplay(`${basePrefix} - Vehicle Image`, collateral.vehicleImageUrl),
        formatDocumentForDisplay(`${basePrefix} - Property Papers`, collateral.propertyPapersUrl),
        formatDocumentForDisplay(`${basePrefix} - Property Image`, collateral.propertyImageUrl),
        formatDocumentForDisplay(`${basePrefix} - Asset Image`, collateral.assetImageUrl),
      ];
      collateralDocs.forEach(doc => {
        if (doc) allDocumentsForDisplay.push(doc);
      });
      // Also add any general document URLs if available on collateral
      if (collateral.documentUrls && collateral.documentUrls.length > 0) {
        collateral.documentUrls.forEach((url, docIdx) => {
          allDocumentsForDisplay.push(formatDocumentForDisplay(`${basePrefix} - Add'l Doc ${docIdx + 1}`, url)!);
        });
      }
    });
  }

  // General Supporting Documents (now checking for URLs)
  if (application.generalSupportingDocumentUrls && application.generalSupportingDocumentUrls.length > 0) {
    application.generalSupportingDocumentUrls.forEach((url, index) => {
      allDocumentsForDisplay.push(formatDocumentForDisplay(`General Document ${index + 1}`, url)!);
    });
  }

  const playRejectionAudio = () => {
    if (application.rejectionDetails?.audioUrl) {
      if (rejectionAudioRef.current) {
        rejectionAudioRef.current.src = application.rejectionDetails.audioUrl;
        rejectionAudioRef.current.play().catch(e => console.error("Error playing audio:", e));
        toast({ title: "Playing Audio", description: "Rejection audio is now playing." });
      }
    }
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          ऋण आवेदन विवरण (Loan Application Details)
        </CardTitle>
        <CardDescription>आवेदन ID (Application ID): {application.id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-1 flex items-center"><UserCircle className="mr-2 h-5 w-5 text-muted-foreground" />आवेदक जानकारी (Applicant Information)</h3>
            <p><strong className="text-muted-foreground">नाम (Name):</strong> {application.borrowerFullName || application.fullName}</p>
            <p><strong className="text-muted-foreground">ईमेल (Email):</strong> {application.borrowerEmail || application.email}</p>
            <p><strong className="text-muted-foreground">संपर्क नंबर (Contact No):</strong> {application.borrowerContactNo || 'N/A'}</p> {/* Updated */}
            <p><strong className="text-muted-foreground">पता (Address):</strong> {application.borrowerAddress || 'N/A'}</p> {/* Updated */}
            <p><strong className="text-muted-foreground">पहचान प्रमाण (ID Proof):</strong> {application.borrowerIdProofType || 'N/A'}</p> {/* Updated */}
            <p><strong className="text-muted-foreground">पते का प्रमाण (Address Proof):</strong> {application.borrowerAddressProofType || 'N/A'}</p> {/* Updated */}
          </div>
          <div>
            <h3 className="font-semibold mb-1 flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-muted-foreground" />आवेदन समयरेखा (Application Timeline)</h3>
            <p><strong className="text-muted-foreground">जमा किया गया (Submitted):</strong> <FormattedDate dateString={application.applicationDate || application.submittedDate} /></p>
            <div>
                <strong className="text-muted-foreground">स्थिति (Status):</strong>{' '}
                <Badge variant={application.status === "Approved" ? "default" : application.status === "Rejected" ? "destructive" : "secondary"} className="capitalize">{application.status}</Badge>
            </div>
            {application.approvedDate && (
                 <p><strong className="text-muted-foreground">अनुमोदित (Approved):</strong> <FormattedDate dateString={application.approvedDate} /></p>
            )}
            {application.disbursementDate && (
                 <p><strong className="text-muted-foreground">वितरित (Disbursed):</strong> <FormattedDate dateString={application.disbursementDate} /></p>
            )}
            {application.maturityDate && (
                 <p><strong className="text-muted-foreground">परिपक्वता (Maturity):</strong> <FormattedDate dateString={application.maturityDate} /></p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold flex items-center"><IndianRupee className="mr-2 h-5 w-5 text-muted-foreground" />ऋण विवरण (Loan Details)</h3>
          <p><strong className="text-muted-foreground">अनुरोधित राशि (Amount Requested):</strong> ₹{application.requestedAmount?.toLocaleString() || application.loanAmount?.toLocaleString() || 'N/A'}</p>
          {application.approvedAmount && application.approvedAmount > 0 && (
             <p><strong className="text-muted-foreground">अनुमोदित राशि (Amount Approved):</strong> ₹{application.approvedAmount.toLocaleString()}</p>
           )}
          <p><strong className="text-muted-foreground">उद्देश्य (Purpose):</strong> {application.purpose || application.loanPurpose}</p>
          {application.interestRate && <p><strong className="text-muted-foreground">ब्याज दर (Interest Rate):</strong> {application.interestRate}% ({application.interestType || 'N/A'})</p>}
          {application.loanTermMonths && <p><strong className="text-muted-foreground">ऋण अवधि (Loan Term):</strong> {application.loanTermMonths} महीने</p>}
          {application.repaymentFrequency && <p><strong className="text-muted-foreground">पुनर्भुगतान आवृत्ति (Repayment Frequency):</strong> {application.repaymentFrequency}</p>}
          {application.processingFee && <p><strong className="text-muted-foreground">प्रोसेसिंग शुल्क (Processing Fee):</strong> ₹{application.processingFee.toLocaleString()}</p>}
          {application.otherCharges && application.otherCharges.length > 0 && (
            <div>
              <strong className="text-muted-foreground">अन्य शुल्क (Other Charges):</strong>
              <ul className="list-disc list-inside ml-4">
                {application.otherCharges.map((charge, i) => (
                  <li key={i}>{charge.description}: ₹{charge.amount.toLocaleString()}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
                <h3 className="font-semibold mb-1 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />वित्तीय प्रोफ़ाइल (उपयोगकर्ता द्वारा बताया गया) (Financial Profile (User Stated))</h3>
                <p><strong className="text-muted-foreground">वार्षिक आय (Annual Income):</strong> ₹{application.income?.toLocaleString() || 'N/A'}</p>
                <p><strong className="text-muted-foreground">रोजगार (Employment):</strong> {application.employmentStatus || 'N/A'}</p>
            </div>
            <div>
                <h3 className="font-semibold mb-1 flex items-center"><ShieldQuestion className="mr-2 h-5 w-5 text-muted-foreground" />क्रेडिट जानकारी (उपयोगकर्ता द्वारा बताया गया) (Credit Information (User Stated))</h3>
                <p><strong className="text-muted-foreground">क्रेडिट स्कोर (Credit Score):</strong> {application.creditScore || 'प्रदान नहीं किया गया'}</p>
            </div>
        </div>

        {/* Loan Repayment Details (for active/approved loans) */}
        {(application.status === 'Active' || application.status === 'Approved' || application.status === 'PaidOff' || application.status === 'Overdue' || application.status === 'Defaulted') && (
            <div className="space-y-2">
                <h3 className="font-semibold flex items-center"><IndianRupee className="mr-2 h-5 w-5 text-muted-foreground" />पुनर्भुगतान अवलोकन (Repayment Overview)</h3>
                <p><strong className="text-muted-foreground">वितरित मूलधन (Principal Disbursed):</strong> ₹{application.principalDisbursed?.toLocaleString() || 'N/A'}</p>
                <p><strong className="text-muted-foreground">वर्तमान बकाया मूलधन (Current Principal Outstanding):</strong> ₹{application.currentPrincipalOutstanding?.toLocaleString() || 'N/A'}</p>
                <p><strong className="text-muted-foreground">वर्तमान बकाया ब्याज (Current Interest Outstanding):</strong> ₹{application.currentInterestOutstanding?.toLocaleString() || 'N/A'}</p>
                <p><strong className="text-muted-foreground">कुल चुकाया गया मूलधन (Total Principal Repaid):</strong> ₹{application.totalPrincipalRepaid?.toLocaleString() || 'N/A'}</p>
                <p><strong className="text-muted-foreground">कुल चुकाया गया ब्याज (Total Interest Repaid):</strong> ₹{application.totalInterestRepaid?.toLocaleString() || 'N/A'}</p>
                <p><strong className="text-muted-foreground">कुल चुकाए गए दंड (Total Penalties Paid):</strong> ₹{application.totalPenaltiesPaid?.toLocaleString() || 'N/A'}</p>
                <p><strong className="text-muted-foreground">अंतिम भुगतान तिथि (Last Payment Date):</strong> <FormattedDate dateString={application.lastPaymentDate} /></p>
                <p><strong className="text-muted-foreground">अगली भुगतान देय तिथि (Next Payment Due Date):</strong> <FormattedDate dateString={application.nextPaymentDueDate} /></p>
                <p><strong className="text-muted-foreground">अगली भुगतान राशि (Next Payment Amount):</strong> ₹{application.nextPaymentAmount?.toLocaleString() || 'N/A'}</p>
            </div>
        )}


        {application.guarantor && (
            <div className="space-y-2">
                <h3 className="font-semibold mb-1 flex items-center"><UsersIcon className="mr-2 h-5 w-5 text-muted-foreground" />गारंटर जानकारी (Guarantor Information)</h3>
                <p><strong className="text-muted-foreground">नाम (Name):</strong> {application.guarantor.fullName}</p>
                <p><strong className="text-muted-foreground">संपर्क (Contact):</strong> {application.guarantor.contactNo}</p>
                <p><strong className="text-muted-foreground">पता (Address):</strong> {application.guarantor.address}</p>
                <p><strong className="text-muted-foreground">पहचान प्रमाण प्रकार (ID Proof Type):</strong> {application.guarantor.idProofType || 'N/A'}</p>
                <p><strong className="text-muted-foreground">पते का प्रमाण प्रकार (Address Proof Type):</strong> {application.guarantor.addressProofType || 'N/A'}</p>
                <p><strong className="text-muted-foreground">संबंध (Relationship):</strong> {application.guarantor.relationshipToBorrower || 'N/A'}</p>
            </div>
        )}

        {application.submittedCollateral && application.submittedCollateral.length > 0 && (
             <div className="space-y-2">
                <h3 className="font-semibold mb-1 flex items-center"><Paperclip className="mr-2 h-5 w-5 text-muted-foreground" />जमा की गई संपार्श्विक (Submitted Collateral)</h3>
                {application.submittedCollateral.map((collateral, index) => (
                    <div key={index} className="pl-4 border-l-2 border-muted-foreground/20 py-1 my-1">
                        <p className="font-medium">{collateral.type.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">{collateral.description}</p>
                        {collateral.estimatedValue && <p className="text-xs text-muted-foreground">मूल्य (Value): ₹{collateral.estimatedValue.toLocaleString()}</p>}
                        {collateral.atmPin && <p className="text-xs text-destructive">ATM पिन प्रदान किया गया (संवेदनशील) (ATM PIN Provided (Sensitive))</p>}
                        {collateral.chequeNumber && <p className="text-xs text-muted-foreground">चेक नंबर (Cheque No): {collateral.chequeNumber}</p>}
                         {collateral.vehicleChallanDetails && <p className="text-xs text-muted-foreground">चालान (Challan): {collateral.vehicleChallanDetails}</p>}
                         {collateral.assetDetails && <p className="text-xs text-muted-foreground">संपत्ति विवरण (Asset Details): {collateral.assetDetails}</p>}
                    </div>
                ))}
            </div>
        )}

        {/* Display Rejection Details if application is rejected */}
        {application.status === 'Rejected' && application.rejectionDetails && (
            <div className="space-y-2">
                <h3 className="font-semibold flex items-center text-destructive"><XCircle className="mr-2 h-5 w-5" />अस्वीकृति का कारण (Rejection Reason)</h3>
                {application.rejectionDetails.text && (
                    <p className="text-sm"><strong>कारण (Reason):</strong> {application.rejectionDetails.text}</p>
                )}
                {application.rejectionDetails.imageUrl && (
                    <div>
                        <p className="text-sm flex items-center gap-1"><strong>छवि (Image):</strong> <ImageIcon className="h-4 w-4 text-muted-foreground"/> <a href={application.rejectionDetails.imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">छवि देखें (View Image)</a></p>
                    </div>
                )}
                {application.rejectionDetails.audioUrl && (
                    <div>
                        <p className="text-sm flex items-center gap-1"><strong>ऑडियो (Audio):</strong> <Volume2 className="h-4 w-4 text-muted-foreground"/>
                            <button onClick={playRejectionAudio} className="text-primary hover:underline ml-1">ऑडियो चलाएँ (Play Audio)</button>
                            <audio ref={rejectionAudioRef} src={application.rejectionDetails.audioUrl} className="hidden"></audio>
                        </p>
                    </div>
                )}
                {application.rejectionDetails.rejectedAt && (
                    <p className="text-xs text-muted-foreground">अस्वीकृत तिथि (Rejected on): <FormattedDate dateString={application.rejectionDetails.rejectedAt} options={{ year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }} /></p>
                )}
                {/* Optionally display admin who rejected if populated */}
                {/* <p className="text-xs text-muted-foreground">Rejected by: {application.rejectionDetails.adminId}</p> */}
            </div>
        )}


        <div className="space-y-2">
          <h3 className="font-semibold flex items-center"><Info className="mr-2 h-5 w-5 text-muted-foreground" />अपलोड किए गए दस्तावेज़ (Uploaded Documents)</h3>
          {allDocumentsForDisplay.length > 0 ? (
            <>
              <ul className="list-disc list-inside pl-5 space-y-1 text-sm">
                {allDocumentsForDisplay.map((doc, index) => (
                  <li key={index}>
                    <strong className="text-muted-foreground">{doc.label}:</strong>{' '}
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline cursor-pointer break-all"
                      onClick={(e) => {
                        toast({
                          title: "दस्तावेज़ खोल रहा है (Opening Document)",
                          description: `"${doc.displayName}" को एक नए टैब में खोलने का प्रयास किया जा रहा है। (Attempting to open "${doc.displayName}" in a new tab.)`,
                          variant: "default",
                        });
                      }}
                    >
                      {doc.displayName} (देखने के लिए क्लिक करें) (Click to View)
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                ये दस्तावेज़ क्लाउडिनरी पर सुरक्षित रूप से संग्रहीत हैं। (These documents are stored securely on Cloudinary.)
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">इस आवेदन रिकॉर्ड से कोई दस्तावेज़ संलग्न नहीं है। (No documents attached to this application record.)</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
