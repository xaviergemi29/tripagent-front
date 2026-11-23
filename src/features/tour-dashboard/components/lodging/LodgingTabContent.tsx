import { useState } from "react";
import { QueryErrorState } from "@/components/shared/QueryErrorState";
import { useTourLodging } from "../../hooks/useLodging";
import { HotelEmptyState } from "./HotelEmptyState";
import { LodgingBoard } from "./LodgingBoard";
import { LodgingBoardSkeleton } from "./LodgingBoardSkeleton";
import { RoomRegistrationModal } from "./RoomRegistrationModal";

interface LodgingTabContentProps {
  tourId: string;
  tourTitle: string;
  departureDateTime: string;
  returnDate?: string | null;
  unassignedPassengersCount: number;
  suggestedBreakdown?: { matrimoniales: number; doblesIndividuales: number };
  /** Modo Auditoría o Solo Lectura: se consulta el tablero, pero no se ofrece capturar. */
  readOnly?: boolean;
}

/** Pestaña "Hospedaje": estado vacío sin hoteles o tablero de habitaciones y camas. */
export function LodgingTabContent({
  tourId,
  tourTitle,
  departureDateTime,
  returnDate,
  unassignedPassengersCount,
  suggestedBreakdown,
  readOnly = false,
}: LodgingTabContentProps) {
  const { data, isLoading, isError, isFetching, refetch } = useTourLodging(tourId);
  // `hotelName` precarga el modal para agregar lotes a ese hotel; vacío = hotel nuevo.
  const [modal, setModal] = useState({ isOpen: false, hotelName: "" });
  const openModal = readOnly
    ? undefined
    : (hotelName = "") => setModal({ isOpen: true, hotelName });

  if (isLoading) {
    return <LodgingBoardSkeleton />;
  }

  if (isError && !data) {
    return (
      <QueryErrorState
        resourceName="hospedaje"
        resourceArticle="el"
        variant="compact"
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  return (
    <>
      {data && data.hotels.length > 0 ? (
        <LodgingBoard
          tourId={tourId}
          tourTitle={tourTitle}
          departureDateTime={departureDateTime}
          returnDate={returnDate}
          lodging={data}
          readOnly={readOnly}
          onRegisterClick={openModal}
        />
      ) : (
        <HotelEmptyState
          unassignedPassengersCount={unassignedPassengersCount}
          suggestedBreakdown={suggestedBreakdown}
          onAddHotelClick={openModal && (() => openModal())}
        />
      )}
      {!readOnly && (
        <RoomRegistrationModal
          isOpen={modal.isOpen}
          onClose={() => setModal((current) => ({ ...current, isOpen: false }))}
          tourId={tourId}
          initialHotelName={modal.hotelName}
        />
      )}
    </>
  );
}
