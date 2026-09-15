import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TourForm } from "../TourForm"
import { TOUR_FORM_COPY } from "../../constants/copy"

// 1. Mockeamos la mutación de TanStack Query para aislar la prueba de llamadas reales a red
vi.mock("../../hooks/useCreateTour", () => ({
    useCreateTour: () => ({
        mutateAsync: vi.fn().mockResolvedValue({}),
        isPending: false,
    }),
}))

describe("TourForm - Pruebas de Integración", () => {

    it("Should render main fields form", () => {
        render(<TourForm />)

        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.title.label)).toBeInTheDocument()
        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.deaperture)).toBeInTheDocument()
        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.capacity)).toBeInTheDocument()
        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.description)).toBeInTheDocument()
        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.recommendations)).toBeInTheDocument()
        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.price)).toBeInTheDocument()
        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.duration)).toBeInTheDocument()
        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.pointOfOrigin)).toBeInTheDocument()
        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.paymentTypes.spei.title)).toBeInTheDocument()
        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.paymentTypes.credit.title)).toBeInTheDocument()
        expect(screen.getByLabelText(TOUR_FORM_COPY.fields.paymentTypes.cash.title)).toBeInTheDocument()

        expect(screen.getByRole("button", { name: TOUR_FORM_COPY.actions.reset })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: TOUR_FORM_COPY.actions.reset })).toBeEnabled()

        expect(screen.getByRole("button", { name: TOUR_FORM_COPY.actions.submit })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: TOUR_FORM_COPY.actions.submit })).toBeDisabled()
    })

    it("Should only display bank details when the 'SPEI' check is active.", async () => {
        const user = userEvent.setup()
        render(<TourForm />)

        expect(screen.queryByLabelText(TOUR_FORM_COPY.fields.paymentTypes.spei.label)).not.toBeInTheDocument()

        const speiCheckbox = screen.getByRole("checkbox", { name: TOUR_FORM_COPY.fields.paymentTypes.spei.title })
        await user.click(speiCheckbox)

        const bankDetailsInput = screen.getByLabelText(TOUR_FORM_COPY.fields.paymentTypes.spei.label)
        expect(bankDetailsInput).toBeInTheDocument()

        await user.click(speiCheckbox)
        expect(bankDetailsInput).not.toBeInTheDocument()
    })

    it("Should only display bank details when the 'CREDIT' check is active.", async () => {
        const user = userEvent.setup()
        render(<TourForm />)

        expect(screen.queryByLabelText(TOUR_FORM_COPY.fields.paymentTypes.credit.label)).not.toBeInTheDocument()

        const creditCheckbox = screen.getByRole("checkbox", { name: TOUR_FORM_COPY.fields.paymentTypes.credit.title })
        await user.click(creditCheckbox)

        const creditDetailsInput = screen.getByLabelText(TOUR_FORM_COPY.fields.paymentTypes.credit.label)
        expect(creditDetailsInput).toBeInTheDocument()

        await user.click(creditCheckbox)
        expect(creditDetailsInput).not.toBeInTheDocument()
    })

    it("Should only display bank details when the 'CASH' check is active.", async () => {
        const user = userEvent.setup()
        render(<TourForm />)

        expect(screen.queryByLabelText(TOUR_FORM_COPY.fields.paymentTypes.cash.label)).not.toBeInTheDocument()

        const cashCheckbox = screen.getByRole("checkbox", { name: TOUR_FORM_COPY.fields.paymentTypes.cash.title })
        await user.click(cashCheckbox)

        const cashDetailsInput = screen.getByLabelText(TOUR_FORM_COPY.fields.paymentTypes.cash.label)
        expect(cashDetailsInput).toBeInTheDocument()

        await user.click(cashCheckbox)
        expect(cashDetailsInput).not.toBeInTheDocument()
    })

    it("Should must disable the default submit button", async () => {
        render(<TourForm />)

        const submitButton = screen.getByRole("button", { name: TOUR_FORM_COPY.actions.submit })
        expect(submitButton).toBeDisabled();
    })

    it("Should eneabled 'Guardar Tour' button", async () => {
        const user = userEvent.setup()
        render(<TourForm />)

        const titleInput = screen.getByRole("textbox", { name: TOUR_FORM_COPY.fields.title.label })
        expect(titleInput).toHaveValue("")

        await user.type(titleInput, "Ruta del Café")
        expect(titleInput).toHaveValue("Ruta del Café")

        const departureInput = screen.getByLabelText(TOUR_FORM_COPY.fields.deaperture)
        expect(departureInput).toHaveValue("")

        const targetDate = "2026-08-15T09:00"
        await user.type(departureInput, targetDate)
        expect(departureInput).toHaveValue(targetDate)

        const capacityInput = screen.getByLabelText(TOUR_FORM_COPY.fields.capacity)
        expect(capacityInput).toHaveValue(0);

        await user.type(capacityInput, "15")
        expect(capacityInput).toHaveValue(15)

        const descriptionInput = screen.getByRole("textbox", { name: TOUR_FORM_COPY.fields.description })
        expect(descriptionInput).toHaveValue("")

        await user.type(descriptionInput, "Descripción del tour")
        expect(descriptionInput).toHaveValue("Descripción del tour")

        const recommendationsInput = screen.getByRole("textbox", { name: TOUR_FORM_COPY.fields.recommendations })
        expect(recommendationsInput).toHaveValue("")

        await user.type(recommendationsInput, "Recomendaciones del tour")
        expect(recommendationsInput).toHaveValue("Recomendaciones del tour")

        const priceInput = screen.getByLabelText(TOUR_FORM_COPY.fields.price);
        expect(priceInput).toHaveValue(0);

        await user.type(priceInput, "100");
        expect(priceInput).toHaveValue(100)

        const durationInput = screen.getByLabelText(TOUR_FORM_COPY.fields.duration);
        expect(durationInput).toHaveValue(0);

        await user.type(durationInput, "1");
        expect(durationInput).toHaveValue(1)

        const meetingInput = screen.getByRole("textbox", { name: TOUR_FORM_COPY.fields.pointOfOrigin })
        expect(meetingInput).toHaveValue("");

        await user.type(meetingInput, "Punto de encuentro en gasolinea del oxxo")
        expect(meetingInput).toHaveValue("Punto de encuentro en gasolinea del oxxo")

        const acceptBankTransferCheckbox = screen.getByRole("checkbox", { name: TOUR_FORM_COPY.fields.paymentTypes.spei.title })
        expect(acceptBankTransferCheckbox).not.toBeChecked()

        const acceptCreditCheckbox = screen.getByRole("checkbox", { name: TOUR_FORM_COPY.fields.paymentTypes.credit.title })
        expect(acceptCreditCheckbox).not.toBeChecked()

        const acceptCashCheckbox = screen.getByRole("checkbox", { name: TOUR_FORM_COPY.fields.paymentTypes.cash.title })
        expect(acceptCashCheckbox).not.toBeChecked()

        await user.click(acceptBankTransferCheckbox);
        expect(acceptBankTransferCheckbox).toBeChecked()

        const speiDetailInput = screen.getByRole("textbox", { name: TOUR_FORM_COPY.fields.paymentTypes.spei.label })
        expect(speiDetailInput).toBeInTheDocument()
        expect(speiDetailInput).toHaveValue("");

        await user.type(speiDetailInput, "Información bancaria para la transferencia como número de cuenta, CLABE y nombre")
        expect(speiDetailInput).toHaveValue("Información bancaria para la transferencia como número de cuenta, CLABE y nombre");

        const resetButton = screen.getByRole("button", { name: TOUR_FORM_COPY.actions.reset });
        expect(resetButton).toBeEnabled();

        const submitButton = screen.getByRole("button", { name: TOUR_FORM_COPY.actions.submit });
        expect(submitButton).toBeEnabled();
    })

    it("Should reset the form to its default state when clicking the Reset button", async () => {
    const user = userEvent.setup()
    render(<TourForm />)

    // ==========================================
    // 1. ARRANGE: Ensuciar el formulario
    // ==========================================
    const titleInput = screen.getByRole("textbox", { name: TOUR_FORM_COPY.fields.title.label })
    await user.type(titleInput, "Ruta del Café")

    const capacityInput = screen.getByLabelText(TOUR_FORM_COPY.fields.capacity)
    await user.clear(capacityInput) // Limpiamos el 0 por defecto antes de escribir
    await user.type(capacityInput, "15")

    const acceptBankTransferCheckbox = screen.getByRole("checkbox", { name: TOUR_FORM_COPY.fields.paymentTypes.spei.title })
    await user.click(acceptBankTransferCheckbox)

    // Al activar el checkbox, el campo condicional debe existir en el DOM
    const speiDetailInput = screen.getByRole("textbox", { name: TOUR_FORM_COPY.fields.paymentTypes.spei.label })
    await user.type(speiDetailInput, "Información bancaria de prueba")

    // Comprobamos que el formulario efectivamente está "sucio"
    expect(titleInput).toHaveValue("Ruta del Café")
    expect(capacityInput).toHaveValue(15)
    expect(acceptBankTransferCheckbox).toBeChecked()
    expect(speiDetailInput).toHaveValue("Información bancaria de prueba")

    // ==========================================
    // 2. ACT: Disparar el Reset
    // ==========================================
    const resetButton = screen.getByRole("button", { name: TOUR_FORM_COPY.actions.reset })
    expect(resetButton).toBeEnabled()
    await user.click(resetButton)

    // ==========================================
    // 3. ASSERT: Verificar el estado por defecto
    // ==========================================
    // Los campos de texto deben estar vacíos
    expect(titleInput).toHaveValue("")
    
    // Los inputs numéricos deben regresar al default definido en tu esquema (0)
    expect(capacityInput).toHaveValue(0)

    // Los checkboxes deben desmarcarse
    expect(acceptBankTransferCheckbox).not.toBeChecked()

    // CRÍTICO: El campo condicional ya no debe existir en el DOM
    // Usamos queryByRole en lugar de getByRole porque esperamos que sea null
    expect(screen.queryByRole("textbox", { name: TOUR_FORM_COPY.fields.paymentTypes.spei.label })).not.toBeInTheDocument()
})
})