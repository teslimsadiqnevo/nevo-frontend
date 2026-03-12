'use client'

import { RegistrationConfirmation, TeacherForm } from "@/features/TeacherRegistration"
import { MiniFooter } from "@/widgets"
import { useState } from "react"

export default function TeacherRegisterPage() {
    const [isRegistered, setIsRegistered] = useState(false);

    return (
        <div>
            <MiniFooter speaker />
            {!isRegistered ? (
                <TeacherForm onSuccess={() => setIsRegistered(true)} />
            ) : (
                <RegistrationConfirmation />
            )}
        </div>
    )
}