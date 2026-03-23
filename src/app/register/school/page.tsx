'use client'

import { RegistrationConfirmation, SchoolForm } from "@/features/SchoolRegistration"
import { MiniFooter } from "@/widgets"
import { useState } from "react"

export default function SchoolRegisterPage() {
    const [isRegistered, setIsRegistered] = useState(false);

    return (
        <div>
            <MiniFooter speaker />
            {!isRegistered ? (
                <SchoolForm onSuccess={() => setIsRegistered(true)} />
            ) : (
                <RegistrationConfirmation />
            )}
        </div>
    )
}