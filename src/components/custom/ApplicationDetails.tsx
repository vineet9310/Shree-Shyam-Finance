// src/components/custom/ApplicationDetails.tsx

"use client";
import type { LoanApplication, CollateralDocument } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, UserCircle, CalendarDays, IndianRupee, Briefcase, ShieldQuestion, Info, Paperclip, Users as UsersIcon, Volume2, Image as ImageIcon, XCircle, ChevronRight } from "lucide-react"; // Added ChevronRight for collapsible sections
import FormattedDate from "@/components/custom/FormattedDate";
import { useToast } from "@/hooks/use-toast";
import { useRef, useState } from "react"; // Import useState for collapsible sections

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

  // State for collapsible sections
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['applicant_info', 'loan_details', 'financial_profile', 'uploaded_documents']));

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionOpen = (sectionId: string) => openSections.has(sectionId);


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
    <Card className="shadow-lg rounded-xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 text-white">
      <CardHeader className="bg-gray-800 border-b border-gray-700 p-6">
        <CardTitle className="text-3xl font-bold flex items-center gap-3 text-primary-foreground">
          <FileText className="h-8 w-8 text-blue-400" />
          Loan Application Details
        </CardTitle>
        <CardDescription className="text-gray-400 text-lg mt-2">Application ID: <span className="font-mono text-blue-300">{application.id}</span></CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-8">

        {/* Applicant Information */}
        <div className="bg-gray-700/30 rounded-lg p-5 shadow-inner border border-gray-700">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('applicant_info')}>
            <h3 className="text-xl font-semibold flex items-center text-blue-300">
              <UserCircle className="mr-3 h-6 w-6" />Applicant Information
            </h3>
            <ChevronRight className={`h-6 w-6 transition-transform ${isSectionOpen('applicant_info') ? 'rotate-90' : ''}`} />
          </div>
          {isSectionOpen('applicant_info') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-gray-600">
              <p><strong className="text-gray-300">Name:</strong> {application.borrowerFullName || application.fullName}</p>
              <p><strong className="text-gray-300">Email:</strong> {application.borrowerEmail || application.email}</p>
              <p><strong className="text-gray-300">Contact No:</strong> {application.borrowerContactNo || 'N/A'}</p>
              <p><strong className="text-gray-300">Address:</strong> {application.borrowerAddress || 'N/A'}</p>
              <p><strong className="text-gray-300">ID Proof:</strong> {application.borrowerIdProofType || 'N/A'}</p>
              <p><strong className="text-gray-300">Address Proof:</strong> {application.borrowerAddressProofType || 'N/A'}</p>
            </div>
          )}
        </div>

        {/* Application Timeline */}
        <div className="bg-gray-700/30 rounded-lg p-5 shadow-inner border border-gray-700">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('application_timeline')}>
            <h3 className="text-xl font-semibold flex items-center text-blue-300">
              <CalendarDays className="mr-3 h-6 w-6" />Application Timeline
            </h3>
            <ChevronRight className={`h-6 w-6 transition-transform ${isSectionOpen('application_timeline') ? 'rotate-90' : ''}`} />
          </div>
          {isSectionOpen('application_timeline') && (
            <div className="text-sm mt-4 pt-4 border-t border-gray-600 space-y-2">
              <p><strong className="text-gray-300">Submitted:</strong> <FormattedDate dateString={application.applicationDate || application.submittedDate} /></p>
              <div>
                  <strong className="text-gray-300">Status:</strong>{' '}
                  <Badge variant={application.status === "Approved" ? "default" : application.status === "Rejected" ? "destructive" : "secondary"} className="capitalize text-base px-3 py-1 rounded-full">
                    {application.status}
                  </Badge>
              </div>
              {application.approvedDate && (
                   <p><strong className="text-gray-300">Approved:</strong> <FormattedDate dateString={application.approvedDate} /></p>
              )}
              {application.disbursementDate && (
                   <p><strong className="text-gray-300">Disbursed:</strong> <FormattedDate dateString={application.disbursementDate} /></p>
              )}
              {application.maturityDate && (
                   <p><strong className="text-gray-300">Maturity:</strong> <FormattedDate dateString={application.maturityDate} /></p>
              )}
            </div>
          )}
        </div>

        {/* Loan Details Section */}
        <div className="bg-gray-700/30 rounded-lg p-5 shadow-inner border border-gray-700">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('loan_details')}>
            <h3 className="text-xl font-semibold flex items-center text-blue-300">
              <IndianRupee className="mr-3 h-6 w-6" />Loan Details
            </h3>
            <ChevronRight className={`h-6 w-6 transition-transform ${isSectionOpen('loan_details') ? 'rotate-90' : ''}`} />
          </div>
          {isSectionOpen('loan_details') && (
            <div className="text-sm mt-4 pt-4 border-t border-gray-600 space-y-2">
              <p><strong className="text-gray-300">Amount Requested:</strong> <span className="text-green-400">₹{application.requestedAmount?.toLocaleString() || application.loanAmount?.toLocaleString() || 'N/A'}</span></p>
              {application.approvedAmount && application.approvedAmount > 0 && (
                 <p><strong className="text-gray-300">Amount Approved:</strong> <span className="text-green-400">₹{application.approvedAmount.toLocaleString()}</span></p>
               )}
              <p><strong className="text-gray-300">Purpose:</strong> {application.purpose || application.loanPurpose}</p>
              {application.interestRate && <p><strong className="text-gray-300">Interest Rate:</strong> {application.interestRate}% ({application.interestType || 'N/A'})</p>}
              {application.loanTermMonths && <p><strong className="text-gray-300">Loan Term:</strong> {application.loanTermMonths} months</p>}
              {application.repaymentFrequency && <p><strong className="text-gray-300">Repayment Frequency:</strong> {application.repaymentFrequency}</p>}
              {application.processingFee && <p><strong className="text-gray-300">Processing Fee:</strong> ₹{application.processingFee.toLocaleString()}</p>}
              {application.otherCharges && application.otherCharges.length > 0 && (
                <div>
                  <strong className="text-gray-300">Other Charges:</strong>
                  <ul className="list-disc list-inside ml-4 text-gray-300">
                    {application.otherCharges.map((charge, i) => (
                      <li key={i}>{charge.description}: ₹{charge.amount.toLocaleString()}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Financial Profile & Credit Information */}
        <div className="bg-gray-700/30 rounded-lg p-5 shadow-inner border border-gray-700">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('financial_credit_info')}>
            <h3 className="text-xl font-semibold flex items-center text-blue-300">
              <Briefcase className="mr-3 h-6 w-6" />Financial & Credit Profile
            </h3>
            <ChevronRight className={`h-6 w-6 transition-transform ${isSectionOpen('financial_credit_info') ? 'rotate-90' : ''}`} />
          </div>
          {isSectionOpen('financial_credit_info') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 pt-4 border-t border-gray-600">
                <div>
                    <h4 className="font-medium text-gray-200 mb-2 flex items-center"><Briefcase className="mr-2 h-5 w-5 text-muted-foreground" />Financial Profile (User Stated)</h4>
                    <p><strong className="text-gray-300">Monthly Income:</strong> ₹{application.monthlyIncome?.toLocaleString() || 'N/A'}</p>
                    <p><strong className="text-gray-300">Employment:</strong> {application.employmentStatus || 'N/A'}</p>
                    {application.employmentStatus === 'employed' && application.jobType && (
                        <p><strong className="text-gray-300">Job Type:</strong> {application.jobType}</p>
                    )}
                    {application.employmentStatus === 'self-employed' && application.businessDescription && (
                        <p><strong className="text-gray-300">Business Description:</strong> {application.businessDescription}</p>
                    )}
                </div>
                <div>
                    <h4 className="font-medium text-gray-200 mb-2 flex items-center"><ShieldQuestion className="mr-2 h-5 w-5 text-muted-foreground" />Credit Information (User Stated)</h4>
                    <p><strong className="text-gray-300">Credit Score:</strong> {application.creditScore || 'Not Provided'}</p>
                </div>
            </div>
          )}
        </div>

        {/* Loan Repayment Details (for active/approved loans) */}
        {(application.status === 'Active' || application.status === 'Approved' || application.status === 'PaidOff' || application.status === 'Overdue' || application.status === 'Defaulted') && (
          <div className="bg-gray-700/30 rounded-lg p-5 shadow-inner border border-gray-700">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('repayment_overview')}>
              <h3 className="text-xl font-semibold flex items-center text-blue-300">
                <IndianRupee className="mr-3 h-6 w-6" />Repayment Overview
              </h3>
              <ChevronRight className={`h-6 w-6 transition-transform ${isSectionOpen('repayment_overview') ? 'rotate-90' : ''}`} />
            </div>
            {isSectionOpen('repayment_overview') && (
              <div className="text-sm mt-4 pt-4 border-t border-gray-600 space-y-2">
                  <p><strong className="text-gray-300">Principal Disbursed:</strong> ₹{application.principalDisbursed?.toLocaleString() || 'N/A'}</p>
                  <p><strong className="text-gray-300">Current Principal Outstanding:</strong> ₹{application.currentPrincipalOutstanding?.toLocaleString() || 'N/A'}</p>
                  <p><strong className="text-gray-300">Current Interest Outstanding:</strong> ₹{application.currentInterestOutstanding?.toLocaleString() || 'N/A'}</p>
                  <p><strong className="text-gray-300">Total Principal Repaid:</strong> ₹{application.totalPrincipalRepaid?.toLocaleString() || 'N/A'}</p>
                  <p><strong className="text-gray-300">Total Interest Repaid:</strong> ₹{application.totalInterestRepaid?.toLocaleString() || 'N/A'}</p>
                  <p><strong className="text-gray-300">Total Penalties Paid:</strong> ₹{application.totalPenaltiesPaid?.toLocaleString() || 'N/A'}</p>
                  <p><strong className="text-gray-300">Last Payment Date:</strong> <FormattedDate dateString={application.lastPaymentDate} /></p>
                  <p><strong className="text-gray-300">Next Payment Due Date:</strong> <FormattedDate dateString={application.nextPaymentDueDate} /></p>
                  <p><strong className="text-gray-300">Next Payment Amount:</strong> ₹{application.nextPaymentAmount?.toLocaleString() || 'N/A'}</p>
              </div>
            )}
          </div>
        )}

        {/* Guarantor Information */}
        {application.guarantor && (
          <div className="bg-gray-700/30 rounded-lg p-5 shadow-inner border border-gray-700">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('guarantor_info')}>
              <h3 className="text-xl font-semibold flex items-center text-blue-300">
                <UsersIcon className="mr-3 h-6 w-6" />Guarantor Information
              </h3>
              <ChevronRight className={`h-6 w-6 transition-transform ${isSectionOpen('guarantor_info') ? 'rotate-90' : ''}`} />
            </div>
            {isSectionOpen('guarantor_info') && (
              <div className="text-sm mt-4 pt-4 border-t border-gray-600 space-y-2">
                  <p><strong className="text-gray-300">Name:</strong> {application.guarantor.fullName}</p>
                  <p><strong className="text-gray-300">Contact:</strong> {application.guarantor.contactNo}</p>
                  <p><strong className="text-gray-300">Address:</strong> {application.guarantor.address}</p>
                  <p><strong className="text-gray-300">ID Proof Type:</strong> {application.guarantor.idProofType || 'N/A'}</p>
                  <p><strong className="text-gray-300">Address Proof Type:</strong> {application.guarantor.addressProofType || 'N/A'}</p>
                  <p><strong className="text-gray-300">Relationship:</strong> {application.guarantor.relationshipToBorrower || 'N/A'}</p>
              </div>
            )}
          </div>
        )}

        {/* Submitted Collateral */}
        {application.submittedCollateral && application.submittedCollateral.length > 0 && (
          <div className="bg-gray-700/30 rounded-lg p-5 shadow-inner border border-gray-700">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('submitted_collateral')}>
              <h3 className="text-xl font-semibold flex items-center text-blue-300">
                <Paperclip className="mr-3 h-6 w-6" />Submitted Collateral
              </h3>
              <ChevronRight className={`h-6 w-6 transition-transform ${isSectionOpen('submitted_collateral') ? 'rotate-90' : ''}`} />
            </div>
            {isSectionOpen('submitted_collateral') && (
              <div className="text-sm mt-4 pt-4 border-t border-gray-600 space-y-3">
                  {application.submittedCollateral.map((collateral, index) => (
                      <div key={index} className="pl-4 border-l-2 border-blue-500/50 py-2 my-2 bg-gray-800/50 rounded-md">
                          <p className="font-medium text-lg text-blue-200">{collateral.type.replace(/_/g, ' ')}</p>
                          <p className="text-gray-300">{collateral.description}</p>
                          {collateral.estimatedValue && <p className="text-gray-300">Value: <span className="text-green-400">₹{collateral.estimatedValue.toLocaleString()}</span></p>}
                          {collateral.atmPin && <p className="text-red-400 flex items-center"><XCircle className="h-4 w-4 mr-1"/>ATM PIN Provided (Sensitive)</p>}
                          {collateral.chequeNumber && <p className="text-gray-300">Cheque No: {collateral.chequeNumber}</p>}
                           {collateral.vehicleChallanDetails && <p className="text-gray-300">Challan: {collateral.vehicleChallanDetails}</p>}
                           {collateral.assetDetails && <p className="text-gray-300">Asset Details: {collateral.assetDetails}</p>}
                      </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Display Rejection Details if application is rejected */}
        {application.status === 'Rejected' && application.rejectionDetails && (
            <div className="bg-red-900/40 rounded-lg p-5 shadow-inner border border-red-700">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('rejection_details')}>
                <h3 className="text-xl font-semibold flex items-center text-red-400">
                  <XCircle className="mr-3 h-6 w-6" />Rejection Reason
                </h3>
                <ChevronRight className={`h-6 w-6 transition-transform ${isSectionOpen('rejection_details') ? 'rotate-90' : ''}`} />
              </div>
              {isSectionOpen('rejection_details') && (
                <div className="text-sm mt-4 pt-4 border-t border-red-700 space-y-2">
                    {application.rejectionDetails.text && (
                        <p className="text-red-200"><strong>Reason:</strong> {application.rejectionDetails.text}</p>
                    )}
                    {application.rejectionDetails.imageUrl && (
                        <div>
                            <p className="text-red-200 flex items-center gap-1"><strong>Image:</strong> <ImageIcon className="h-4 w-4 text-red-300"/> <a href={application.rejectionDetails.imageUrl} target="_blank" rel="noopener noreferrer" className="text-red-300 hover:underline">View Image</a></p>
                        </div>
                    )}
                    {application.rejectionDetails.audioUrl && (
                        <div>
                            <p className="text-red-200 flex items-center gap-1"><strong>Audio:</strong> <Volume2 className="h-4 w-4 text-red-300"/>
                                <button onClick={playRejectionAudio} className="text-red-300 hover:underline ml-1">Play Audio</button>
                                <audio ref={rejectionAudioRef} src={application.rejectionDetails.audioUrl} className="hidden"></audio>
                            </p>
                        </div>
                    )}
                    {application.rejectionDetails.rejectedAt && (
                        <p className="text-xs text-red-300">Rejected on: <FormattedDate dateString={application.rejectionDetails.rejectedAt} options={{ year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }} /></p>
                    )}
                </div>
              )}
            </div>
        )}

        {/* Uploaded Documents */}
        <div className="bg-gray-700/30 rounded-lg p-5 shadow-inner border border-gray-700">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('uploaded_documents')}>
            <h3 className="text-xl font-semibold flex items-center text-blue-300">
              <Info className="mr-3 h-6 w-6" />Uploaded Documents
            </h3>
            <ChevronRight className={`h-6 w-6 transition-transform ${isSectionOpen('uploaded_documents') ? 'rotate-90' : ''}`} />
          </div>
          {isSectionOpen('uploaded_documents') && (
            <div className="text-sm mt-4 pt-4 border-t border-gray-600">
              {allDocumentsForDisplay.length > 0 ? (
                <>
                  <ul className="list-disc list-inside pl-5 space-y-2 text-gray-200">
                    {allDocumentsForDisplay.map((doc, index) => (
                      <li key={index}>
                        <strong className="text-gray-300">{doc.label}:</strong>{' '}
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline cursor-pointer break-all"
                          onClick={(e) => {
                            toast({
                              title: "Opening Document",
                              description: `Attempting to open "${doc.displayName}" in a new tab.`,
                              variant: "default",
                            });
                          }}
                        >
                          {doc.displayName} (Click to View)
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-gray-400">No documents attached to this application record.</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
